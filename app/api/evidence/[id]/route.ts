import { NextRequest, NextResponse } from "next/server";
import { localStore } from "@/lib/db/store";
import { EvidenceItemSchema } from "@/lib/db/types";

export const dynamic = "force-dynamic";

// Schema estrito para impedir Mass-Assignment de IDs, usuários ou campos sensíveis
const UpdateEvidenceBodySchema = EvidenceItemSchema.pick({
  evidence_type: true,
  resume_section: true,
  title: true,
  issuer_or_organization: true,
  start_date: true,
  end_date: true,
  issue_date: true,
  expiry_date: true,
  workload_hours: true,
  credential_id: true,
  description: true,
  domain: true,
  skills: true,
  career_signal: true,
}).partial();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await req.json();

    // Validação estrita do payload com Zod
    const parsed = UpdateEvidenceBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos para atualização da evidência.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = localStore.updateEvidence(id, {
      ...parsed.data,
      review_status: "corrected",
      user_locked: true,
    });

    if (!updated) {
      return NextResponse.json({ error: "Evidência não encontrada." }, { status: 404 });
    }

    return NextResponse.json({ success: true, evidence: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    localStore.deleteEvidence(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
