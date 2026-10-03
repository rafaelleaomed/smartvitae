import { NextRequest, NextResponse } from "next/server";
import { extractPdfText } from "@/services/extraction/pdf-extractor";
import { sanitizeTextForAI } from "@/lib/privacy/sanitizer";
import { normalizeCertificateText } from "@/services/extraction/normalizer";
import { getDecisionProvider } from "@/services/decisions";
import { runJevStressTest, StressTestResult } from "@/services/decisions/stress-test";
import { localStore, DEMO_USER_ID } from "@/lib/db/store";
import { TailorService } from "@/services/generation/tailor-service";
import { EvidenceItem } from "@/lib/db/types";
import { validateSafePublicUrl } from "@/lib/security/url-validator";
import { validateUploadedFile } from "@/lib/security/file-validator";

export const dynamic = "force-dynamic";

/**
 * Normaliza links de vagas para garantir acesso direto à página pública da vaga.
 * Ex: Converte links de busca/feed do LinkedIn com currentJobId em URLs canônicas /jobs/view/{id}/
 */
function normalizeJobUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  let url = rawUrl.trim();

  // 1. URLs de busca, coleções ou tracker do LinkedIn com parâmetro currentJobId
  // Ex: https://www.linkedin.com/jobs/search-results/?currentJobId=4469044082...
  const currentJobIdMatch = url.match(/[?&]currentJobId=([0-9]{6,12})/i);
  if (currentJobIdMatch && currentJobIdMatch[1]) {
    return `https://www.linkedin.com/jobs/view/${currentJobIdMatch[1]}/`;
  }

  // 2. URLs com slug de vaga no LinkedIn: /jobs/view/titulo-4469044082/
  const viewJobIdMatch = url.match(/\/jobs\/view\/(?:.*-)?([0-9]{6,12})/i);
  if (viewJobIdMatch && viewJobIdMatch[1]) {
    return `https://www.linkedin.com/jobs/view/${viewJobIdMatch[1]}/`;
  }

  return url;
}

/**
 * Função utilitária para extrair texto de uma página de vaga
 * Protegida contra SSRF (bloqueia IPs internos, localhost e metadados)
 */
async function scrapeJobPage(url: string): Promise<string> {
  try {
    const targetUrl = normalizeJobUrl(url);
    const safetyCheck = validateSafePublicUrl(targetUrl);
    if (!safetyCheck.isValid || !safetyCheck.sanitizedUrl) {
      console.warn("Bloqueio de segurança (SSRF) para URL da vaga:", safetyCheck.reason);
      return "";
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(safetyCheck.sanitizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return "";
    }

    const html = await res.text();

    // 1. Tenta capturar dados estruturados Schema.org JobPosting
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch && jsonLdMatch[1]) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        if (jsonLd["@type"] === "JobPosting" || jsonLd.description) {
          const title = jsonLd.title || "";
          const desc = (jsonLd.description || "").replace(/<[^>]+>/g, " ");
          const reqs = jsonLd.qualifications || jsonLd.skills || "";
          const full = `Vaga: ${title}\n\nDescrição e Requisitos:\n${desc} ${reqs}`.trim();
          if (full.length > 100) return full;
        }
      } catch (e) {
        // segue para seletores de DOM
      }
    }

    // 2. Seletores específicos de plataformas de vagas (LinkedIn, Gupy, Glassdoor, etc.)
    const jobMarkupSelectors = [
      /class="show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /class="description__text[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
      /<div[^>]*class="[^"]*decorated-job-posting__details[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*data-testid="job-description"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ];

    const titleMatch =
      html.match(/<title>(.*?)<\/title>/i) ||
      html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["'](.*?)["']/i);
    const cleanTitle = titleMatch
      ? titleMatch[1].replace(/ \| LinkedIn.*| - Gupy.*| - Vagas.*/, "").trim()
      : "Vaga Pretendida";

    for (const regex of jobMarkupSelectors) {
      const match = html.match(regex);
      if (match && match[1]) {
        const cleanText = match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (cleanText.length > 80 && !cleanText.includes("Nunca usou o LinkedIn?")) {
          return `Vaga: ${cleanTitle}\n\nDescrição e Requisitos:\n${cleanText}`;
        }
      }
    }

    // 3. Fallback para OpenGraph e Meta Description
    const descMatch =
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i) ||
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["'](.*?)["']/i);
    const metaDesc = descMatch ? descMatch[1].replace(/<[^>]+>/g, " ").trim() : "";

    // 4. Se caiu em tela de login/cookies do LinkedIn, rejeita para pedir texto manual
    const isBlockedByLogin = html.includes("d_jobs_guest_details") && !html.includes("show-more-less-html__markup");
    if (isBlockedByLogin && (!metaDesc || metaDesc.length < 50)) {
      return "";
    }

    if (metaDesc.length > 100 && !metaDesc.includes("Faça login")) {
      return `Vaga: ${cleanTitle}\n\nResumo da Oportunidade:\n${metaDesc}`;
    }

    return "";
  } catch (err: any) {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    let resumeText = "";
    let jobText = "";
    let jobUrl = "";
    let uploadedFile: File | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      uploadedFile = formData.get("resumeFile") as File | null;
      resumeText = (formData.get("resumeText") as string) || "";
      jobText = (formData.get("jobText") as string) || "";
      jobUrl = (formData.get("jobUrl") as string) || "";
    } else {
      const body = await req.json();
      resumeText = body.resumeText || "";
      jobText = body.jobText || "";
      jobUrl = body.jobUrl || "";
    }

    // 1. Extração do Currículo
    if (uploadedFile) {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const validation = validateUploadedFile(uploadedFile, bytes);

      if (!validation.isValid) {
        return NextResponse.json({ error: validation.reason }, { status: 400 });
      }

      try {
        const pdfData = await extractPdfText(bytes);
        resumeText = pdfData.text;
      } catch (err: any) {
        console.warn("Falha na leitura direta do PDF:", err.message);
      }
    }

    // Validação do Currículo
    if (!resumeText || resumeText.trim().length < 15) {
      return NextResponse.json(
        {
          error:
            "Por favor, forneça o seu currículo (suba o arquivo PDF/DOCX ou cole o texto do seu perfil) no Passo 1.",
        },
        { status: 400 }
      );
    }

    // 2. Extração da Vaga (Web Scraping ou Texto Colado)
    let extractedJobText = jobText ? jobText.trim() : "";

    const canonicalJobUrl = jobUrl ? normalizeJobUrl(jobUrl.trim()) : "";

    if (canonicalJobUrl && canonicalJobUrl.length > 10 && extractedJobText.length < 20) {
      const scraped = await scrapeJobPage(canonicalJobUrl);
      if (scraped && scraped.length > 50) {
        extractedJobText = scraped;
      }
    }

    // Se após tentar a URL o texto continuar vazio ou insuficiente
    if (!extractedJobText || extractedJobText.length < 15) {
      return NextResponse.json(
        {
          error:
            "Não foi possível ler os detalhes da vaga diretamente pelo link (o site da vaga bloqueia robôs ou exige autenticação). Por favor, copie e cole o texto ou requisitos da vaga no campo 'Descrição da Vaga' para que o JEV avalie com precisão real.",
          needsManualJobText: true,
        },
        { status: 400 }
      );
    }

    // 3. Sanitização de PII antes de enviar ao JEV
    const sanitizedResume = sanitizeTextForAI(resumeText);
    const sanitizedJob = sanitizeTextForAI(extractedJobText);

    // 4. Estruturação Inteligente via Claude (Filtragem de Ruídos e Organização em Categorias)
    let parsedCv;
    try {
      const { structureResumeWithClaude } = await import("@/services/ai/claude-service");
      parsedCv = await structureResumeWithClaude(resumeText);
    } catch (e: any) {
      console.warn("Fallback para extrator determinístico regex:", e.message);
      const { parseCvTextToEvidences } = await import("@/services/extraction/cv-section-parser");
      parsedCv = parseCvTextToEvidences(resumeText);
    }

    // Atualiza o perfil estritamente com os dados declarados pelo usuário
    localStore.updateProfile(DEMO_USER_ID, {
      full_name: parsedCv.candidateName,
      crm_number: parsedCv.crmNumber,
      crm_state: parsedCv.crmState,
      rqe_numbers: parsedCv.rqeNumbers,
    });

    // Popula a Base de Evidências com os fatos estruturados
    if (parsedCv.evidences.length > 0) {
      localStore.setEvidences(parsedCv.evidences);
    }


    const stressTest: StressTestResult = await runJevStressTest(
      sanitizedResume.sanitizedText,
      sanitizedJob.sanitizedText,
      jobUrl
    );

    const jobTitle = sanitizedJob.sanitizedText.split("\n")[0].substring(0, 80);

    // Se o veredito for KILL: BLOQUEIA adaptação de currículo mentiroso!
    if (stressTest.verdict === "kill" || !stressTest.allowResumeGeneration) {
      return NextResponse.json({
        success: true,
        stressTest,
        canAdapt: false,
        jobTitle,
        message:
          "Veredito KILL: O SmartVitae identificou que seu perfil é frontalmente desalinhado com esta vaga. Adaptação bloqueada para evitar alucinação.",
      });
    }

    // Se o veredito for FIX ou SHIP: Retorna os dados para a página de adaptação
    return NextResponse.json({
      success: true,
      stressTest,
      canAdapt: true,
      jobTitle,
      jobText: extractedJobText,
      jobUrl,
      parsedCv,
    });
  } catch (error: any) {
    console.error("Erro na avaliação de estresse Jev:", error);
    return NextResponse.json(
      { error: `Erro na avaliação: ${error.message}` },
      { status: 500 }
    );
  }
}
