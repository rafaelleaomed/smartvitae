import { NextRequest, NextResponse } from "next/server";
import { localStore, DEMO_USER_ID } from "@/lib/db/store";
import { structureResumeWithClaude } from "@/services/ai/claude-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const evidences = localStore.getEvidence(DEMO_USER_ID);

    if (!evidences || evidences.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma evidência cadastrada para reorganizar." },
        { status: 400 }
      );
    }

    // Agrupa todo o texto bruto ou títulos das evidências atuais
    const combinedText = evidences
      .map(
        (e) =>
          `[${e.resume_section}] ${e.title} (${e.issuer_or_organization || "N/A"}): ${
            e.description || e.source_excerpt || ""
          }`
      )
      .join("\n\n");

    const structured = await structureResumeWithClaude(combinedText);

    if (structured.evidences && structured.evidences.length > 0) {
      localStore.setEvidences(structured.evidences);
    }

    return NextResponse.json({
      success: true,
      count: structured.evidences.length,
      evidences: structured.evidences,
    });
  } catch (error: any) {
    console.error("Erro na reorganização de evidências:", error);
    return NextResponse.json(
      { error: error.message || "Falha ao reorganizar evidências com Claude." },
      { status: 500 }
    );
  }
}
