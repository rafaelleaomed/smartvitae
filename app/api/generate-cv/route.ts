import { NextRequest, NextResponse } from "next/server";
import { generateTailoredResumeWithClaude } from "@/services/ai/claude-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { jobTitle, jobText, evidences, candidateName, crmInfo, declaredGaps } =
      await req.json();

    if (!evidences || evidences.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma evidência fornecida para a reestruturação." },
        { status: 400 }
      );
    }

    const restructuredCv = await generateTailoredResumeWithClaude({
      jobTitle: jobTitle || "Oportunidade Profissional",
      jobText: jobText || "",
      evidences,
      candidateName: candidateName || "Candidato",
      crmInfo: crmInfo || null,
      declaredGaps: declaredGaps || [],
    });

    return NextResponse.json({ success: true, restructuredCv });
  } catch (error: any) {
    console.error("Erro no /api/generate-cv:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao reestruturar currículo com IA." },
      { status: 500 }
    );
  }
}
