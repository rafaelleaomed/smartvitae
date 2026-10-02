import { NextRequest, NextResponse } from "next/server";
import { extractPdfText } from "@/services/extraction/pdf-extractor";
import { sanitizeTextForAI } from "@/lib/privacy/sanitizer";
import { normalizeCertificateText } from "@/services/extraction/normalizer";
import { getDecisionProvider } from "@/services/decisions";
import { localStore, DEMO_USER_ID } from "@/lib/db/store";
import { TailorService } from "@/services/generation/tailor-service";
import { EvidenceItem } from "@/lib/db/types";

export const dynamic = "force-dynamic";

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

    // 1. Processa novo currículo se enviado
    if (uploadedFile) {
      try {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const pdfData = await extractPdfText(new Uint8Array(arrayBuffer));
        resumeText = pdfData.text;
      } catch (err: any) {
        console.warn("Falha na leitura direta do PDF:", err.message);
      }
    }

    // Se temos texto novo de currículo, extrai evidências e adiciona ao perfil
    if (resumeText && resumeText.trim().length > 20) {
      const sanitized = sanitizeTextForAI(resumeText);
      const normalized = normalizeCertificateText(sanitized.sanitizedText, 1);
      const decisionProvider = getDecisionProvider();

      const decision = await decisionProvider.classifyCertificate({
        document_label: uploadedFile ? uploadedFile.name : "Currículo Enviado",
        normalized_title: normalized.title,
        issuer: normalized.issuer,
        dates: { issued: normalized.issue_date || undefined },
        workload_hours: normalized.workload_hours,
        text_excerpt: normalized.excerpt,
      });

      const newEvidence: EvidenceItem = {
        id: `ev-curriculo-${Date.now()}`,
        user_id: DEMO_USER_ID,
        document_id: null,
        evidence_type: decision.evidence_type,
        resume_section: decision.resume_section,
        title: normalized.title,
        issuer_or_organization: normalized.issuer,
        issue_date: normalized.issue_date,
        workload_hours: normalized.workload_hours,
        credential_id: normalized.credential_id,
        description: normalized.excerpt,
        skills: [],
        source_excerpt: normalized.excerpt,
        source_pages: [1],
        classification_source: decision.decision_source,
        confidence: decision.confidence,
        career_signal: decision.career_signal,
        review_status: "approved",
        user_locked: true,
        created_at: new Date().toISOString(),
      };

      localStore.addEvidence(newEvidence);
    }

    // Se temos uma URL da vaga e o texto está em branco, tenta obter metadados básicos
    if (jobUrl && (!jobText || jobText.trim().length < 10)) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(jobUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          const html = await res.text();
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);
          jobText = titleMatch ? `Vaga: ${titleMatch[1]}` : `Vaga publicada em ${jobUrl}`;
        }
      } catch (e) {
        jobText = `Vaga publicada em ${jobUrl}`;
      }
    }

    if (!jobText || jobText.trim().length < 5) {
      jobText = "Médico de Inovação e Saúde Digital. Requisitos: Experiência em avaliação clínica, residência médica, conhecimento em tecnologias em saúde e liderança.";
    }

    const profile = localStore.getProfile(DEMO_USER_ID);
    const evidences = localStore.getEvidence(DEMO_USER_ID);

    const tailorService = new TailorService();
    const jobAnalysis = await tailorService.parseJobDescription(jobText, jobUrl);
    const result = await tailorService.matchAndTailor(profile, jobAnalysis, evidences);

    return NextResponse.json({
      success: true,
      jobAnalysis,
      result,
    });
  } catch (error: any) {
    console.error("Erro na adaptação do currículo:", error);
    return NextResponse.json(
      { error: `Erro na adaptação do currículo: ${error.message}` },
      { status: 500 }
    );
  }
}
