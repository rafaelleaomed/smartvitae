import { NextRequest, NextResponse } from "next/server";
import { localStore, DEMO_USER_ID } from "@/lib/db/store";
import { EvidenceItemSchema } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const evidence = localStore.getEvidence(DEMO_USER_ID);
    const profile = localStore.getProfile(DEMO_USER_ID);
    const documents = localStore.getDocuments(DEMO_USER_ID);

    return NextResponse.json({
      success: true,
      profile,
      evidence,
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
      user_id: DEMO_USER_ID,
      classification_source: "user",
      confidence: 1.0,
      user_locked: true,
      created_at: new Date().toISOString(),
    });

    const created = localStore.addEvidence(validated);
    return NextResponse.json({ success: true, evidence: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
