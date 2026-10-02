import { NextRequest, NextResponse } from "next/server";
import { localStore, DEMO_USER_ID } from "@/lib/db/store";
import { EvidenceItemSchema } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const evidence = localStore.getEvidence(DEMO_USER_ID);
    const profile = localStore.getProfile(DEMO_USER_ID);
    const documents = localStore.getDocuments(DEMO_USER_ID);

    const sanitizedEvidence = evidence.map((e) => ({
      ...e,
      confidence: typeof e.confidence === "number" && !isNaN(e.confidence) ? e.confidence : 0.95,
      classification_source: e.classification_source || "jev",
      career_signal: e.career_signal || 4,
    }));

    return NextResponse.json({
      success: true,
      profile,
      evidence: sanitizedEvidence,
      documents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = EvidenceItemSchema.parse({
      ...body,
      id: body.id || crypto.randomUUID(),
      user_id: DEMO_USER_ID,
      classification_source: body.classification_source || "user",
      confidence: body.confidence ?? 1.0,
      user_locked: body.user_locked ?? false,
      review_status: body.review_status || "pending",
      created_at: new Date().toISOString(),
    });

    const created = localStore.addEvidence(validated);
    return NextResponse.json({ success: true, evidence: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
