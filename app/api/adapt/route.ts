import { NextRequest, NextResponse } from "next/server";
import { extractPdfText } from "@/services/extraction/pdf-extractor";
import { sanitizeTextForAI } from "@/lib/privacy/sanitizer";
import { normalizeCertificateText } from "@/services/extraction/normalizer";
import { getDecisionProvider } from "@/services/decisions";
import { runJevStressTest, StressTestResult } from "@/services/decisions/stress-test";
import { localStore, DEMO_USER_ID } from "@/lib/db/store";
import { TailorService } from "@/services/generation/tailor-service";
import { EvidenceItem } from "@/lib/db/types";

export const dynamic = "force-dynamic";

/**
 * Função utilitária para extrair texto de uma página de vaga
 */
async function scrapeJobPage(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
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
          return `Vaga: ${title}\n\nDescrição e Requisitos:\n${desc} ${reqs}`.trim();
        }
      } catch (e) {
        // segue para outros métodos
      }
    }

    // 2. Extrai OpenGraph e Meta Description
    const titleMatch = html.match(/<title>(.*?)<\/title>/i) || html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["'](.*?)["']/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i) || html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["'](.*?)["']/i);

    // 3. Remove scripts, styles e tags para pegar o texto visível
    const cleanBody = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanBody.length > 250) {
      // Pega trecho substancial da página
      return `Vaga: ${titleMatch ? titleMatch[1] : ""}\n\n${descMatch ? descMatch[1] : ""}\n\n${cleanBody.substring(0, 3500)}`;
    }

    if (titleMatch || descMatch) {
      return `Vaga: ${titleMatch ? titleMatch[1] : ""}\nDescrição: ${descMatch ? descMatch[1] : ""}`;
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
      try {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const pdfData = await extractPdfText(new Uint8Array(arrayBuffer));
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

    if (jobUrl && jobUrl.trim().length > 10 && extractedJobText.length < 20) {
      const scraped = await scrapeJobPage(jobUrl.trim());
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

    // 4. Executa o Teste de Estresse Jev Multi-Dimensional (Inspirado no KillMyIdea)
    const stressTest: StressTestResult = await runJevStressTest(
      sanitizedResume.sanitizedText,
      sanitizedJob.sanitizedText,
      jobUrl
    );

    // Se o veredito for KILL: BLOQUEIA adaptação de currículo mentiroso!
    if (stressTest.verdict === "kill" || !stressTest.allowResumeGeneration) {
      return NextResponse.json({
        success: true,
        stressTest,
        result: null, // Sem currículo alucinado
        jobTitle: sanitizedJob.sanitizedText.split("\n")[0].substring(0, 80),
        message:
          "Veredito KILL: O NexoVitae identificou que seu perfil é frontalmente desalinhado com esta vaga. Currículo adaptado bloqueado para evitar alucinação.",
      });
    }

    const baseProfile = localStore.getProfile(DEMO_USER_ID);
    const firstLine = resumeText.trim().split("\n")[0].trim();
    const candidateName =
      firstLine.length > 3 &&
      firstLine.length < 50 &&
      !firstLine.toLowerCase().includes("currículo") &&
      !firstLine.toLowerCase().includes("resumo")
        ? firstLine
        : baseProfile.full_name;

    const candidateProfile = {
      ...baseProfile,
      full_name: candidateName,
    };
    // Cria um item de evidência dinâmico baseado no currículo real enviado pelo usuário
    const candidateEvidences: EvidenceItem[] = [
      {
        id: `ev-real-${Date.now()}`,
        user_id: DEMO_USER_ID,
        evidence_type: "experiencia",
        resume_section: "experiencia",
        title: "Trajetória Profissional Comprovada",
        description: sanitizedResume.sanitizedText.substring(0, 500),
        skills: [],
        source_pages: [1],
        source_excerpt: sanitizedResume.sanitizedText.substring(0, 300),
        classification_source: "jev",
        confidence: 0.95,
        career_signal: 4,
        review_status: "approved",
        user_locked: true,
        created_at: new Date().toISOString(),
      },
    ];

    const tailorService = new TailorService();
    const jobAnalysis = await tailorService.parseJobDescription(sanitizedJob.sanitizedText, jobUrl);
    const result = await tailorService.matchAndTailor(candidateProfile, jobAnalysis, candidateEvidences);

    // Ajusta o score do currículo para respeitar a nota exata do Jev Stress Test
    result.adherenceScore = stressTest.score;

    return NextResponse.json({
      success: true,
      stressTest,
      jobAnalysis,
      result,
    });
  } catch (error: any) {
    console.error("Erro na avaliação de estresse Jev:", error);
    return NextResponse.json(
      { error: `Erro na avaliação: ${error.message}` },
      { status: 500 }
    );
  }
}
