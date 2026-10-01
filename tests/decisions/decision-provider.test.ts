import { describe, it, expect } from "vitest";
import { LocalRuleDecisionProvider } from "@/services/decisions/local-provider";
import { JevDecisionProvider } from "@/services/decisions/jev-provider";

describe("Motor de Decisão (Jev & Local Rules)", () => {
  const localProvider = new LocalRuleDecisionProvider();

  it("deve classificar residência médica como alto risco com revisão humana obrigatória", async () => {
    const decision = await localProvider.classifyCertificate({
      document_label: "Certificado de Conclusão",
      normalized_title: "Programa de Residência Médica em Clínica Médica",
      issuer: "Hospital das Clínicas da FMUSP",
      dates: { issued: "2024-02" },
      workload_hours: 5760,
      text_excerpt: "Concluiu o programa de Residência Médica credenciado pela CNRM.",
    });

    expect(decision.evidence_type).toBe("residencia");
    expect(decision.resume_section).toBe("formacao");
    expect(decision.career_signal).toBe(5);
    expect(decision.requires_human_review).toBe(true); // Trava CFM
  });

  it("deve classificar curso livre sem promover para especialidade ou residência", async () => {
    const decision = await localProvider.classifyCertificate({
      document_label: "Certificado",
      normalized_title: "Curso Livre de Introdução à Inteligência Artificial na Saúde",
      issuer: "Plataforma Online",
      dates: { issued: "2025-08" },
      workload_hours: 20,
      text_excerpt: "Participou do curso livre online de 20 horas de IA na Saúde.",
    });

    expect(decision.evidence_type).toBe("curso_livre");
    expect(decision.resume_section).toBe("cursos");
    expect(decision.career_signal).toBe(2);
    expect(decision.requires_human_review).toBe(false);
  });

  it("deve classificar pós-graduação lato sensu mantendo revisão para evitar confusão com RQE", async () => {
    const decision = await localProvider.classifyCertificate({
      document_label: "Certificado de Especialização Lato Sensu",
      normalized_title: "Pós-graduação Lato Sensu em Gestão em Saúde",
      issuer: "Instituto de Ensino e Pesquisa Albert Einstein",
      dates: { issued: "2023-12" },
      workload_hours: 420,
      text_excerpt: "Concluiu o curso de pós-graduação lato sensu em Gestão em Saúde.",
    });

    expect(decision.evidence_type).toBe("pos_graduacao");
    expect(decision.resume_section).toBe("formacao");
    expect(decision.requires_human_review).toBe(true);
  });

  it("JevDecisionProvider deve utilizar fallback seguro se chaves não estiverem configuradas", async () => {
    const jevProvider = new JevDecisionProvider();
    const decision = await jevProvider.classifyCertificate({
      document_label: "Certificado",
      normalized_title: "Curso de Suporte Avançado de Vida (ACLS)",
      issuer: "American Heart Association",
      dates: { issued: "2024-05" },
      workload_hours: 16,
      text_excerpt: "Provider card in Advanced Cardiovascular Life Support (ACLS)",
    });

    expect(decision.evidence_type).toBe("certificacao_profissional");
    expect(decision.resume_section).toBe("certificacoes");
    expect(decision.confidence).toBeGreaterThanOrEqual(0.75);
  });
});
