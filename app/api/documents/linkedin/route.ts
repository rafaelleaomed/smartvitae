import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { LinkedInService } from "@/services/extraction/linkedin-service";
import { sanitizeTextForAI } from "@/lib/privacy/sanitizer";
import { getDecisionProvider } from "@/services/decisions";
import { localStore, DEMO_USER_ID } from "@/lib/db/store";
import { DocumentRecord, EvidenceItem } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profileUrl, rawText } = body;

    if (!profileUrl) {
      return NextResponse.json(
        { error: "URL do LinkedIn é obrigatória." },
        { status: 400 }
      );
    }

    const linkedInService = new LinkedInService();
    const result = await linkedInService.processProfile(profileUrl, rawText);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // Se o LinkedIn exigiu autenticação e não temos texto/export fornecido
    if (result.requiresAssistedExport && result.evidenceItems.length === 0) {
      return NextResponse.json({
        success: true,
        requiresAssistedExport: true,
        message: result.message,
        profileUrl,
      });
    }

    // Hash da URL e conteúdo para rastreabilidade
    const contentString = `${profileUrl}-${rawText || ""}-${Date.now()}`;
    const sha256 = crypto.createHash("sha256").update(contentString).digest("hex");

    const docId = `doc-linkedin-${Date.now()}`;
    const docRecord: DocumentRecord = {
      id: docId,
      user_id: DEMO_USER_ID,
      source_type: "linkedin",
      storage_path: profileUrl,
      original_name: `LinkedIn: ${profileUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "")}`,
      mime_type: "text/html",
      sha256,
      status: "extracted",
      page_count: 1,
      raw_text: rawText || `Importação do perfil: ${profileUrl}`,
      created_at: new Date().toISOString(),
    };

    localStore.addDocument(docRecord);

    const decisionProvider = getDecisionProvider();
    const createdEvidences: EvidenceItem[] = [];

    // Classifica cada evidência obtida do LinkedIn com o Jev
    for (const item of result.evidenceItems) {
      const sanitized = sanitizeTextForAI(item.excerpt);
      const decision = await decisionProvider.classifyCertificate({
        document_label: `LinkedIn - ${profileUrl}`,
        normalized_title: item.title,
        issuer: item.issuer,
        dates: {
          issued: item.issue_date || undefined,
          start: item.start_date || undefined,
          end: item.end_date || undefined,
        },
        workload_hours: item.workload_hours,
        text_excerpt: sanitized.sanitizedText,
      });

      const evidenceItem: EvidenceItem = {
        id: `ev-li-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        user_id: DEMO_USER_ID,
        document_id: docId,
        evidence_type: decision.evidence_type,
        resume_section: decision.resume_section,
        title: item.title,
        issuer_or_organization: item.issuer,
        issue_date: item.issue_date,
        start_date: item.start_date,
        end_date: item.end_date,
        workload_hours: item.workload_hours,
        credential_id: profileUrl,
        description: `Importado do perfil LinkedIn`,
        skills: [],
        source_excerpt: item.excerpt,
        source_pages: [1],
        classification_source: decision.decision_source,
        confidence: decision.confidence,
        career_signal: decision.career_signal,
        review_status: decision.requires_human_review || decision.confidence < 0.9 ? "pending" : "approved",
        user_locked: false,
        created_at: new Date().toISOString(),
      };

      localStore.addEvidence(evidenceItem);
      createdEvidences.push(evidenceItem);
    }

    return NextResponse.json({
      success: true,
      document: docRecord,
      evidenceCount: createdEvidences.length,
      evidences: createdEvidences,
      message: `${createdEvidences.length} evidências foram importadas e classificadas com sucesso pelo Jev!`,
    });
  } catch (error: any) {
    console.error("Erro na importação do LinkedIn:", error);
    return NextResponse.json(
      { error: `Erro na importação do LinkedIn: ${error.message}` },
      { status: 500 }
    );
  }
}
