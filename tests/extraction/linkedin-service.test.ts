import { describe, it, expect } from "vitest";
import {
  LinkedInService,
  isValidLinkedInUrl,
  extractLinkedInHandle,
} from "@/services/extraction/linkedin-service";
import { normalizeCertificateText } from "@/services/extraction/normalizer";

describe("LinkedIn Service e Normalizador", () => {
  const service = new LinkedInService();

  it("deve validar URLs legítimas do LinkedIn", () => {
    expect(isValidLinkedInUrl("https://www.linkedin.com/in/dr-joao-silva/")).toBe(true);
    expect(isValidLinkedInUrl("https://br.linkedin.com/in/maria-medica")).toBe(true);
    expect(isValidLinkedInUrl("https://google.com")).toBe(false);
    expect(isValidLinkedInUrl("")).toBe(false);
  });

  it("deve extrair o handle do usuário a partir da URL", () => {
    expect(extractLinkedInHandle("https://www.linkedin.com/in/dr-joao-silva/")).toBe("dr-joao-silva");
    expect(extractLinkedInHandle("https://br.linkedin.com/in/maria_oliveira")).toBe("maria_oliveira");
  });

  it("deve estruturar seções de texto exportadas do perfil do LinkedIn", () => {
    const rawLinkedInText = `
Experiência
Médico Coordenador da UTI
Hospital Sírio-Libanês
Jan de 2020 - Presente · 4 anos

Formação acadêmica
Faculdade de Medicina da USP
Graduação em Medicina
2010 - 2015

Licenças e certificados
Suporte Avançado de Vida Cardiovascular (ACLS)
American Heart Association
    `;

    const result = service.parseLinkedInText("https://linkedin.com/in/dr-joao-silva", rawLinkedInText);
    expect(result.success).toBe(true);
    expect(result.evidenceItems.length).toBeGreaterThanOrEqual(3);

    const titles = result.evidenceItems.map((item) => item.title);
    expect(titles.some((t) => t.includes("Médico Coordenador"))).toBe(true);
    expect(titles.some((t) => t.includes("Faculdade de Medicina da USP"))).toBe(true);
    expect(titles.some((t) => t.includes("Suporte Avançado de Vida Cardiovascular"))).toBe(true);
  });

  it("normalizador deve extrair carga horária e emissor de trechos de certificados", () => {
    const text = "Certificamos que o Dr. Fulano concluiu o curso de Inteligência Artificial Aplicada à Medicina com carga horária de 120 horas emitido por Associação Médica Brasileira no ano de 2024.";
    const normalized = normalizeCertificateText(text, 1);

    expect(normalized.workload_hours).toBe(120);
    expect(normalized.issue_date).toBe("2024");
    expect(normalized.title.toLowerCase()).toContain("inteligência artificial");
  });
});
