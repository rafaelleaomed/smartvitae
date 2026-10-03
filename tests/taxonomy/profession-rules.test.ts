import { describe, it, expect } from "vitest";
import {
  detectCandidateProfession,
  detectJobRequirements,
  validateProfessionalCompatibility,
} from "@/lib/taxonomy/profession-rules";

describe("Taxonomia Profissional e Regras Regulatórias de Conselhos de Classe", () => {
  const dentistBucoProfile = `
Dra. Camila Santos
Cirurgiã-Dentista | CRO-SP 98765
Especialista em Cirurgia e Traumatologia Bucomaxilofacial
Experiência:
- Residência em Cirurgia e Traumatologia Bucomaxilofacial no Hospital das Clínicas
- Atendimento clínico e cirurgias bucomaxilofaciais hospitalares
- Implantes dentários e cirurgias ortognáticas
Formação:
- Graduação em Odontologia pela USP
- Especialização e Residência em Bucomaxilofacial
`;

  const doctorEndocrinoJob = `
Vaga: Médico Endocrinologista
Hospital Samaritano
Requisitos Obrigatórios:
- Graduação em Medicina com CRM ativo em São Paulo.
- Residência médica formal em Endocrinologia e Metabologia credenciada pela CNRM/MEC ou título de especialista (RQE).
- Atendimento ambulatorial e interconsultas hospitalares.
`;

  const doctorCv = `
Dr. Rafael Leão
Médico Clínico Geral | CRM 123456-SP • RQE 65432
Experiência:
- Médico Assistente no Hospital das Clínicas da FMUSP
- Residência em Clínica Médica pela CNRM
`;

  const salesJob = `
Vaga: Vendedor / Consultor Comercial de Veículos
Empresa: Concessionária AutoMax
Requisitos:
- Vendas presenciais de automóveis e consórcio.
`;

  const healthInnovationJob = `
Vaga: Gerente Médico de Inovação e Saúde Digital
Empresa: Healthtech Brasil
Requisitos:
- Graduação em Medicina com CRM ativo.
- Tecnologias de saúde e inovação.
`;

  it("deve detectar perfil de Dentista Bucomaxilofacial como Odontologia (CRO) e NUNCA como Medicina", () => {
    const profile = detectCandidateProfession(dentistBucoProfile);
    expect(profile.primaryProfession).toBe("odontologia");
    expect(profile.detectedCouncil).toBe("CRO");
    expect(profile.specialties).toContain("Cirurgia e Traumatologia Bucomaxilofacial");
  });

  it("deve detectar vaga de Médico Endocrinologista como privativa de Medicina (CRM)", () => {
    const job = detectJobRequirements(doctorEndocrinoJob);
    expect(job.requiredProfession).toBe("medicina");
    expect(job.requiredCouncil).toBe("CRM");
    expect(job.requiredSpecialty).toBe("Endocrinologia e Metabologia");
    expect(job.isStrictlyRegulated).toBe(true);
  });

  it("CASO CRÍTICO: Dentista Bucomaxilofacial x Vaga de Médico Endocrinologista DEVE SER FATAL KILL", () => {
    const check = validateProfessionalCompatibility(dentistBucoProfile, doctorEndocrinoJob);

    expect(check.isCompatible).toBe(false);
    expect(check.isFatalMismatch).toBe(true);
    expect(check.fatalReason).toContain("Lei do Ato Médico");
    expect(check.fatalReason).toContain("Odontologia");
    expect(check.missingMandatoryGaps.some((g) => g.includes("Medicina"))).toBe(true);
    expect(check.missingMandatoryGaps.some((g) => g.includes("CRM"))).toBe(true);
  });

  it("Médico x Venda de Veículos DEVE SER FATAL KILL", () => {
    const check = validateProfessionalCompatibility(doctorCv, salesJob);
    expect(check.isCompatible).toBe(false);
    expect(check.isFatalMismatch).toBe(true);
  });

  it("Médico x Inovação em Saúde DEVE SER COMPATÍVEL", () => {
    const check = validateProfessionalCompatibility(doctorCv, healthInnovationJob);
    expect(check.isCompatible).toBe(true);
    expect(check.isFatalMismatch).toBe(false);
  });
});
