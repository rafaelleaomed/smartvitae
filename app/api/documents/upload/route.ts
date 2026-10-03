import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { extractPdfText } from "@/services/extraction/pdf-extractor";
import { normalizeCertificateText } from "@/services/extraction/normalizer";
import { sanitizeTextForAI } from "@/lib/privacy/sanitizer";
import { getDecisionProvider } from "@/services/decisions";
import { localStore, DEMO_USER_ID } from "@/lib/db/store";
import { DocumentRecord, EvidenceItem } from "@/lib/db/types";
import { validateUploadedFile } from "@/lib/security/file-validator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    // Leitura e validação rigorosa de bytes, extensões e magic bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const bytes = new Uint8Array(arrayBuffer);

    const validation = validateUploadedFile(file, bytes);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    const safeFileName = validation.sanitizedFileName;

    // 1. Cálculo do Hash SHA-256 (Detecção de duplicidade por integridade)
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

    // 2. Extração de Texto Nativo
    let extractedText = "";
    let pageCount = 1;

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      try {
        const pdfResult = await extractPdfText(new Uint8Array(buffer));
        extractedText = pdfResult.text;
        pageCount = pdfResult.pageCount;
      } catch (err: any) {
        console.warn("Falha no parser nativo de PDF, mantendo texto vazio para OCR:", err.message);
      }
    }

    // Se o PDF foi lido mas não tem texto (ex: documento escaneado/imagem)
    if (!extractedText || extractedText.trim().length < 15) {
      extractedText = `Documento digitalizado: ${file.name}. Aguardando revisão ou OCR.`;
    }

    // 3. Sanitização de PII para conformidade LGPD antes do envio à IA
    const sanitization = sanitizeTextForAI(extractedText);

    // 4. Registro do Documento
    const docId = `doc-${Date.now()}`;
    const newDoc: DocumentRecord = {
      id: docId,
      user_id: DEMO_USER_ID,
      source_type: "upload",
      storage_path: `uploads/${DEMO_USER_ID}/${safeFileName}`,
      original_name: safeFileName,
      mime_type: file.type || "application/pdf",
      sha256,
      status: "extracted",
      page_count: pageCount,
      raw_text: sanitization.sanitizedText,
      created_at: new Date().toISOString(),
    };

    try {
      localStore.addDocument(newDoc);
    } catch (dupError: any) {
      return NextResponse.json({ error: dupError.message }, { status: 409 });
    }

    // 5. Detecta se o arquivo é um Currículo Completo ou um Certificado Individual
    const isCvOrResume =
      safeFileName.toLowerCase().includes("curriculo") ||
      safeFileName.toLowerCase().includes("currículo") ||
      safeFileName.toLowerCase().includes("cv") ||
      file.name.toLowerCase().includes("resume") ||
      (sanitization.sanitizedText.length > 300 &&
        /(experiência|experience|educação|education|formação|formacao|histórico|skills|habilidades)/i.test(
          sanitization.sanitizedText
        ));

    if (isCvOrResume) {
      // Processamento inteligente de Currículo Completo (Claude + JEV)
      let parsedCv;
      try {
        const { structureResumeWithClaude } = await import("@/services/ai/claude-service");
        parsedCv = await structureResumeWithClaude(sanitization.sanitizedText);
      } catch (err: any) {
        console.warn("Fallback para parser determinístico no upload de CV:", err.message);
        const { parseCvTextToEvidences } = await import("@/services/extraction/cv-section-parser");
        parsedCv = parseCvTextToEvidences(sanitization.sanitizedText);
      }

      // Atualiza o perfil do candidato com registros identificados
      localStore.updateProfile(DEMO_USER_ID, {
        full_name: parsedCv.candidateName,
        crm_number: parsedCv.crmNumber,
        crm_state: parsedCv.crmState,
        rqe_numbers: parsedCv.rqeNumbers,
      });

      // Adiciona cada uma das evidências estruturadas à base auditável vinculadas a este documento
      const savedEvidences = parsedCv.evidences.map((ev) => {
        const item: EvidenceItem = {
          ...ev,
          document_id: docId,
        };
        localStore.addEvidence(item);
        return item;
      });

      return NextResponse.json({
        success: true,
        isCv: true,
        document: newDoc,
        evidenceCount: savedEvidences.length,
        evidences: savedEvidences,
      });
    }

    // 6. Caso seja Certificado Individual: Normalização e Classificação pelo JEV
    const normalized = normalizeCertificateText(sanitization.sanitizedText, 1);
    const decisionProvider = getDecisionProvider();

    const decision = await decisionProvider.classifyCertificate({
      document_label: file.name,
      normalized_title: normalized.title,
      issuer: normalized.issuer,
      dates: { issued: normalized.issue_date || undefined },
      workload_hours: normalized.workload_hours,
      text_excerpt: normalized.excerpt,
    });

    const evidenceItem: EvidenceItem = {
      id: `ev-${Date.now()}`,
      user_id: DEMO_USER_ID,
      document_id: docId,
      evidence_type: decision.evidence_type,
      resume_section: decision.resume_section,
      title: normalized.title,
      issuer_or_organization: normalized.issuer,
      issue_date: normalized.issue_date,
      workload_hours: normalized.workload_hours,
      credential_id: normalized.credential_id,
      description: `Evidência extraída do arquivo ${file.name}`,
      skills: [],
      source_excerpt: normalized.excerpt,
      source_pages: [1],
      classification_source: decision.decision_source,
      confidence: decision.confidence,
      career_signal: decision.career_signal,
      review_status: decision.requires_human_review || decision.confidence < 0.9 ? "pending" : "approved",
      user_locked: false,
      created_at: new Date().toISOString(),
    };

    localStore.addEvidence(evidenceItem);

    return NextResponse.json({
      success: true,
      isCv: false,
      document: newDoc,
      evidence: evidenceItem,
      evidenceCount: 1,
      decision,
    });
  } catch (error: any) {
    console.error("Erro no upload e processamento do documento:", error);
    return NextResponse.json(
      { error: `Erro no processamento do documento: ${error.message}` },
      { status: 500 }
    );
  }
}
