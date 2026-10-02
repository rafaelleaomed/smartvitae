import { describe, it, expect } from "vitest";
import { runJevStressTest } from "@/services/decisions/stress-test";


describe("SmartVitae JEV Stress Test", () => {
  const doctorCv = `
Dr. Rafael Leão
Médico Clínico Geral | CRM 123456-SP • RQE 65432
Experiência:
- Médico Assistente no Hospital das Clínicas da FMUSP
- Residência em Clínica Médica pela CNRM
- Cursos em Inteligência Artificial e Saúde Digital pelo Google Cloud
`;

  const salesJob = `
Vaga: Vendedor / Consultor Comercial de Veículos
Empresa: Concessionária AutoMax
Requisitos:
- Experiência comprovada em vendas presenciais de automóveis e negociação de consórcio/financiamento.
- Prospecção ativa de clientes e atingimento de metas agressivas de vendas.
- CNH categoria B e domínio de funil de vendas comercial.
`;

  const healthInnovationJob = `
Vaga: Gerente Médico de Inovação e Saúde Digital
Empresa: Healthtech Brasil
Requisitos:
- Graduação em Medicina com CRM ativo.
- Experiência assistencial ou hospitalar.
- Conhecimentos em Inteligência Artificial e tecnologias de saúde.
`;

  it("deve emitir veredito KILL e bloquear geração de currículo para Médico x Vendedor", async () => {
    const result = await runJevStressTest(doctorCv, salesJob);

    expect(result.verdict).toBe("kill");
    expect(result.allowResumeGeneration).toBe(false);
    expect(result.score).toBeLessThan(45);
    expect(result.honestDiagnosis.length).toBeGreaterThan(50);
    expect(result.dimensions.length).toBe(6);
  }, 25000);

  it("deve emitir veredito SHIP ou FIX para Médico x Vaga de Inovação em Saúde", async () => {
    const result = await runJevStressTest(doctorCv, healthInnovationJob);

    expect(["ship", "fix"]).toContain(result.verdict);
    expect(result.allowResumeGeneration).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(45);
  }, 25000);
});
