import { NextRequest, NextResponse } from "next/server";
import { localStore } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = localStore.updateEvidence(id, {
      ...body,
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
