import { NormalizedCertificateItem } from "./types";

/**
 * Normalizador Determinístico de Evidências Curriculares
 * Extrai campos-chave (horas, datas, credenciais) com regex testada
 * antes de enviar para o motor de decisão.
 */
export function normalizeCertificateText(
  pageText: string,
  pageNumber: number = 1
): NormalizedCertificateItem {
  const clean = pageText.replace(/\s+/g, " ").trim();

  // 1. Extração de Carga Horária (ex: "carga horária de 360 horas", "40h", "120 horas")
  let workload_hours: number | null = null;
  const hoursMatch = clean.match(/(?:carga\s+hor[aá]ria(?:\s+de)?[:\s]*)?(\d{1,4})\s*(?:h(?:oras?)?)\b/i);
  if (hoursMatch) {
    workload_hours = parseInt(hoursMatch[1], 10);
  }

  // 2. Extração de Código de Verificação / Credencial
  let credential_id: string | null = null;
  const credMatch = clean.match(/(?:c[oó]digo(?:\s+de\s+autentica[cç][aã]o)?|registro|autentica[cç][aã]o|credencial)[:\s]+([A-Za-z0-9\-_\.]{5,35})/i);
  if (credMatch) {
    credential_id = credMatch[1];
  }

  // 3. Extração de Datas (ano ou mês/ano)
  let issue_date: string | null = null;
  const yearMatch = clean.match(/\b(20\d{2}|19\d{2})\b/g);
  if (yearMatch && yearMatch.length > 0) {
    // Pega o ano mais recente mencionado
    issue_date = yearMatch[yearMatch.length - 1];
  }

  // 4. Detecção básica de Título (procura palavras após "concluiu o curso de" ou cabeçalhos)
  let title = "Evidência Profissional / Certificado";
  const titleMatch = clean.match(/(?:conclus[aã]o\s+d[oe]|concluiu\s+o\s+curso\s+d[oe]|participou\s+d[oe]|programa\s+de)[:\s]+([^,\.\n]{5,80})/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  } else {
    // Pega as primeiras palavras significativas
    const lines = clean.split(/[.\n]/).filter((l) => l.trim().length > 10);
    if (lines.length > 0) {
      title = lines[0].substring(0, 80).trim();
    }
  }

  // 5. Emissor / Organização
  let issuer: string | null = null;
  const issuerMatch = clean.match(/(?:emitido\s+por|institui[cç][aã]o|universidade|faculdade|hospital|associa[cç][aã]o)[:\s]+([^,\.\n]{3,60})/i);
  if (issuerMatch) {
    issuer = issuerMatch[1].trim();
  }

  // Trecho de evidência (resumo de até 250 caracteres com a frase mais representativa)
  const excerpt = clean.substring(0, 300);

  return {
    title,
    issuer,
    workload_hours,
    issue_date,
    start_date: null,
    end_date: null,
    credential_id,
    excerpt,
    pageNumber,
  };
}
