import { describe, it, expect } from "vitest";
import { localStore, DEMO_USER_ID } from "@/lib/db/store";

describe("Fluxo de API e Repositório de Evidências", () => {
  it("deve carregar os dados de seed inicial com residência médica e certificação", () => {
    const evidences = localStore.getEvidence(DEMO_USER_ID);
    expect(evidences.length).toBeGreaterThanOrEqual(2);

    const residencia = evidences.find((e) => e.evidence_type === "residencia");
    expect(residencia).toBeDefined();
    expect(residencia?.career_signal).toBe(5);
  });

  it("deve aprovar e travar uma evidência com user_locked = true", () => {
    const item = localStore.addEvidence({
      id: "ev-test-lock",
      user_id: DEMO_USER_ID,
      evidence_type: "curso_livre",
      resume_section: "cursos",
      title: "Workshop de Python para Saúde",
      skills: ["Python", "Saúde"],
      classification_source: "user",
      confidence: 0.9,
      career_signal: 3,
      review_status: "pending",
      user_locked: false,
      source_pages: [1],
    });

    expect(item.review_status).toBe("pending");
    expect(item.user_locked).toBe(false);

    const approved = localStore.updateEvidence("ev-test-lock", {
      review_status: "approved",
      user_locked: true,
    });

    expect(approved?.review_status).toBe("approved");
    expect(approved?.user_locked).toBe(true);

    // Tentar sobrescrever sem destravar deve lançar erro
    expect(() => {
      localStore.updateEvidence("ev-test-lock", {
        title: "Tentativa de alteração automática",
      });
    }).toThrow();
  });
});
