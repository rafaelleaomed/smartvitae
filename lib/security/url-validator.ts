/**
 * Validador de Segurança contra SSRF (Server-Side Request Forgery)
 * Impede que requisições externas acessem a rede local, metadados de nuvem ou IPs privados.
 */

export interface SafeUrlResult {
  isValid: boolean;
  sanitizedUrl?: string;
  reason?: string;
}

export function validateSafePublicUrl(rawUrl: string): SafeUrlResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { isValid: false, reason: "URL não fornecida." };
  }

  const trimmed = rawUrl.trim();

  // 1. Limite de tamanho de URL para evitar ReDoS e overflow
  if (trimmed.length > 2048) {
    return { isValid: false, reason: "URL excede o comprimento máximo permitido (2048 caracteres)." };
  }

  // 2. Parse da URL
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, reason: "Formato de URL inválido." };
  }

  // 3. Validação de Protocolo (Apenas HTTP e HTTPS são aceitos)
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      isValid: false,
      reason: `Protocolo '${parsed.protocol}' não permitido. Utilize http ou https.`,
    };
  }

  // 4. Bloqueia credenciais embutidas na URL (ex: http://user:pass@host)
  if (parsed.username || parsed.password) {
    return { isValid: false, reason: "Credenciais na URL não são permitidas." };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 5. Bloqueio de Localhost e Loopback
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return { isValid: false, reason: "Acesso a localhost ou rede interna é estritamente proibido." };
  }

  // 6. Bloqueio de Metadados de Nuvem (AWS, GCP, Azure, OpenStack)
  if (
    hostname === "169.254.169.254" ||
    hostname === "metadata.google.internal" ||
    hostname === "metadata" ||
    hostname === "instance-data"
  ) {
    return { isValid: false, reason: "Acesso a serviços de metadados de infraestrutura é bloqueado." };
  }

  // 7. Bloqueio de Faixas de IPs Privados (RFC 1918 e Link-Local)
  // IPv4 regex check
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octet1 = parseInt(ipv4Match[1], 10);
    const octet2 = parseInt(ipv4Match[2], 10);

    // 0.0.0.0/8
    if (octet1 === 0) {
      return { isValid: false, reason: "IP reservado inválido." };
    }
    // 10.0.0.0/8
    if (octet1 === 10) {
      return { isValid: false, reason: "Acesso a faixa de IP privado (10.0.0.0/8) bloqueado." };
    }
    // 127.0.0.0/8
    if (octet1 === 127) {
      return { isValid: false, reason: "Acesso a loopback bloqueado." };
    }
    // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
    if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) {
      return { isValid: false, reason: "Acesso a faixa de IP privado (172.16.0.0/12) bloqueado." };
    }
    // 192.168.0.0/16
    if (octet1 === 192 && octet2 === 168) {
      return { isValid: false, reason: "Acesso a faixa de IP privado (192.168.0.0/16) bloqueado." };
    }
    // 169.254.0.0/16 (Link-local / Cloud Metadata)
    if (octet1 === 169 && octet2 === 254) {
      return { isValid: false, reason: "Acesso a link-local / metadados bloqueado." };
    }
  }

  return {
    isValid: true,
    sanitizedUrl: parsed.toString(),
  };
}
