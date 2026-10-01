import { NextRequest, NextResponse } from "next/server";
import { localStore } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = localStore.updateEvidence(id, {
      review_status: "rejected",
      user_locked: true,
    });

    if (!updated) {
      return NextResponse.json({ error: "Evidência não encontrada." }, { status: 404 });
    }

    return NextResponse.json({ success: true, evidence: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
