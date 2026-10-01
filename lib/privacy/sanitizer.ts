/**
 * Serviço de Sanitização de Dados para Conformidade LGPD e Sigilo Médico
 * Remove PII (Informações de Identificação Pessoal) e dados sensíveis antes
 * do envio para APIs externas de IA (Jev e LLMs).
 */

export interface SanitizationResult {
  sanitizedText: string;
  hasRedactedPII: boolean;
  redactedCounts: {
    cpf: number;
    rg: number;
    email: number;
    phone: number;
  };
}

export function sanitizeTextForAI(text: string): SanitizationResult {
  if (!text) {
    return {
      sanitizedText: "",
      hasRedactedPII: false,
      redactedCounts: { cpf: 0, rg: 0, email: 0, phone: 0 },
    };
  }

  let sanitized = text;
  let cpfCount = 0;
  let rgCount = 0;
  let emailCount = 0;
  let phoneCount = 0;

  // 1. CPF (formatado 000.000.000-00 ou não-formatado com 11 dígitos)
  const cpfRegex = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
  sanitized = sanitized.replace(cpfRegex, () => {
    cpfCount++;
    return "[CPF_REMOVIDO]";
  });

  // 2. RG (Registro Geral)
  const rgRegex = /\b(?:RG|R\.G\.)[:\s]*[\d\.\-A-Za-z]{6,14}\b/gi;
  sanitized = sanitized.replace(rgRegex, () => {
    rgCount++;
    return "[RG_REMOVIDO]";
  });

  // 3. E-mail
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  sanitized = sanitized.replace(emailRegex, () => {
    emailCount++;
    return "[EMAIL_REMOVIDO]";
  });

  // 4. Telefone celular / fixo brasileiro (com ou sem DDD e DDI)
  const phoneRegex = /(?:\+?55\s?)?(?:\(?\d{2}\)?[\s-]?)?\b9?\d{4}[-\s]?\d{4}\b/g;
  sanitized = sanitized.replace(phoneRegex, (match) => {
    // Evita substituir anos normais como 2024, 2026
    if (match.trim().length === 4 && parseInt(match.trim(), 10) > 1950 && parseInt(match.trim(), 10) < 2100) {
      return match;
    }
    phoneCount++;
    return "[TELEFONE_REMOVIDO]";
  });

  // 5. Menções clínicas explícitas a prontuários/pacientes
  const patientDataRegex = /\b(?:prontu[aá]rio|paciente|leito)\s*[:#]?\s*[\d\w-]+\b/gi;
  sanitized = sanitized.replace(patientDataRegex, "[DADO_CLINICO_REMOVIDO]");

  const hasRedactedPII = cpfCount > 0 || rgCount > 0 || emailCount > 0 || phoneCount > 0;

  return {
    sanitizedText: sanitized,
    hasRedactedPII,
    redactedCounts: {
      cpf: cpfCount,
      rg: rgCount,
      email: emailCount,
      phone: phoneCount,
    },
  };
}
