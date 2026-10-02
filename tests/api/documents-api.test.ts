import { describe, it, expect } from "vitest";
import { localStore, DEMO_USER_ID } from "@/lib/db/store";

describe("Fluxo de API e Repositório de Evidências (Zero Alucinação)", () => {
  it("deve iniciar a base de evidências limpa sem dados fictícios ou alucinações", () => {
    localStore.clearEvidence();
    const evidences = localStore.getEvidence(DEMO_USER_ID);
    expect(evidences.length).toBe(0);

    const profile = localStore.getProfile(DEMO_USER_ID);
    expect(profile.crm_number).toBeNull();
    expect(profile.rqe_numbers).toEqual([]);
  });

  it("deve permitir registrar e travar uma evidência real com user_locked = true", () => {
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

    // Tentar sobrescrever sem destravar deve lançar erro de integridade
    expect(() => {
      localStore.updateEvidence("ev-test-lock", {
        title: "Tentativa de alteração automática",
      });
    }).toThrow();
  });
});
