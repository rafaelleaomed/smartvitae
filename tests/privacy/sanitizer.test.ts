import { describe, it, expect } from "vitest";
import { sanitizeTextForAI } from "@/lib/privacy/sanitizer";

describe("Sanitizador de Dados Sensíveis (LGPD e CFM)", () => {
  it("deve remover CPF formatado e não-formatado", () => {
    const raw = "Dr. Silva, portador do CPF 123.456.789-00 concluiu o curso.";
    const result = sanitizeTextForAI(raw);
    expect(result.sanitizedText).toContain("[CPF_REMOVIDO]");
    expect(result.sanitizedText).not.toContain("123.456.789-00");
    expect(result.redactedCounts.cpf).toBe(1);
    expect(result.hasRedactedPII).toBe(true);
  });

  it("deve remover e-mails e telefones de contato", () => {
    const raw = "Contato: fulano@hospital.com.br ou (11) 98765-4321.";
    const result = sanitizeTextForAI(raw);
    expect(result.sanitizedText).toContain("[EMAIL_REMOVIDO]");
    expect(result.sanitizedText).toContain("[TELEFONE_REMOVIDO]");
    expect(result.sanitizedText).not.toContain("fulano@hospital.com.br");
    expect(result.sanitizedText).not.toContain("98765-4321");
    expect(result.redactedCounts.email).toBe(1);
    expect(result.redactedCounts.phone).toBe(1);
  });

  it("não deve apagar anos normais (ex: 2024, 2026)", () => {
    const raw = "Curso de pós-graduação concluído no ano de 2024 com 360 horas.";
    const result = sanitizeTextForAI(raw);
    expect(result.sanitizedText).toContain("2024");
    expect(result.redactedCounts.phone).toBe(0);
  });

  it("deve mascarar menções diretas a prontuários e leitos", () => {
    const raw = "Relatório referente ao Prontuário: 98124A na UTI.";
    const result = sanitizeTextForAI(raw);
    expect(result.sanitizedText).toContain("[DADO_CLINICO_REMOVIDO]");
    expect(result.sanitizedText).not.toContain("98124A");
  });
});
