import { NormalizedCertificateItem } from "./types";

export interface LinkedInProfileData {
  profileUrl: string;
  fullName?: string;
  headline?: string;
  summary?: string;
  experiences: Array<{
    role: string;
    company: string;
    period?: string;
    description?: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    period?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate?: string;
    credentialId?: string;
  }>;
}

export interface LinkedInImportResult {
  success: boolean;
  profileUrl: string;
  profileData?: LinkedInProfileData;
  evidenceItems: NormalizedCertificateItem[];
  requiresAssistedExport?: boolean;
  message?: string;
}

/**
 * Validador e normalizador de URLs do LinkedIn
 */
export function isValidLinkedInUrl(url: string): boolean {
  if (!url) return false;
  const regex = /^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/(in|pub)\/([a-zA-Z0-9_-]+)\/?.*$/i;
  return regex.test(url.trim());
}

export function extractLinkedInHandle(url: string): string | null {
  const match = url.trim().match(/linkedin\.com\/(?:in|pub)\/([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : null;
}

/**
 * Ingestão de Perfil LinkedIn para o Piloto
 * Suporta leitura de metadados de perfil ou texto bruto exportado do LinkedIn,
 * convertendo seções do perfil em evidências auditáveis.
 */
export class LinkedInService {
  /**
   * Processa perfil a partir de URL e/ou conteúdo bruto (PDF exportado ou texto)
   */
  async processProfile(
    url: string,
    rawTextContent?: string
  ): Promise<LinkedInImportResult> {
    if (!isValidLinkedInUrl(url)) {
      return {
        success: false,
        profileUrl: url,
        evidenceItems: [],
        message: "URL do LinkedIn inválida. Use o formato: https://www.linkedin.com/in/seu-perfil",
      };
    }

    // Se temos conteúdo de texto (ex: colado pelo usuário ou extraído do PDF do LinkedIn)
    if (rawTextContent && rawTextContent.trim().length > 50) {
      return this.parseLinkedInText(url, rawTextContent);
    }

    // Caso seja apenas a URL web: tentamos consultar metadados públicos
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const html = await res.text();

      // Verifica se o LinkedIn respondeu com barreira de login (AuthWall)
      if (
        res.status === 999 ||
        html.includes("authwall") ||
        html.includes("sign-in-form") ||
        html.includes("Join LinkedIn")
      ) {
        return {
          success: true,
          profileUrl: url,
          requiresAssistedExport: true,
          evidenceItems: [],
          message:
            "O LinkedIn solicitou autenticação para este perfil. Utilize o PDF oficial de 1 clique (no LinkedIn: Mais -> Salvar como PDF) ou cole o texto do perfil para ingestão instantânea!",
        };
      }

      // Se houver metadados OpenGraph básicos
      const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
      const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);

      const items: NormalizedCertificateItem[] = [];

      if (titleMatch && titleMatch[1]) {
        items.push({
          title: `Perfil Profissional: ${titleMatch[1]}`,
          issuer: "LinkedIn",
          workload_hours: null,
          issue_date: new Date().getFullYear().toString(),
          start_date: null,
          end_date: null,
          credential_id: url,
          excerpt: descMatch ? descMatch[1] : titleMatch[1],
          pageNumber: 1,
        });
      }

      return {
        success: true,
        profileUrl: url,
        requiresAssistedExport: items.length === 0,
        evidenceItems: items,
        message: "Metadados públicos do LinkedIn carregados com sucesso.",
      };
    } catch (err: any) {
      return {
        success: true,
        profileUrl: url,
        requiresAssistedExport: true,
        evidenceItems: [],
        message:
          "Não foi possível acessar diretamente o link público devido às restrições do LinkedIn. Exporte o PDF do perfil (Mais -> Salvar como PDF) para importação com 100% de precisão.",
      };
    }
  }

  /**
   * Converte texto do perfil do LinkedIn (ou extraído do PDF oficial) em evidências
   */
  parseLinkedInText(url: string, text: string): LinkedInImportResult {
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    const items: NormalizedCertificateItem[] = [];

    let currentSection: "experiencia" | "formacao" | "certificacoes" | "geral" = "geral";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();

      if (lower === "experiência" || lower === "experience") {
        currentSection = "experiencia";
        continue;
      } else if (lower === "formação acadêmica" || lower === "formação" || lower === "education") {
        currentSection = "formacao";
        continue;
      } else if (
        lower.includes("licenças e certificados") ||
        lower.includes("certificações") ||
        lower.includes("licenses & certifications")
      ) {
        currentSection = "certificacoes";
        continue;
      }

      // Se encontrou uma linha que se parece com cargo ou curso e tem tamanho plausível
      if (line.length >= 4 && line.length <= 90 && !line.startsWith("http")) {
        const nextLine = lines[i + 1] || "";
        const nextNextLine = lines[i + 2] || "";

        if (currentSection === "experiencia" && nextLine.length > 0) {
          items.push({
            title: line,
            issuer: nextLine.length < 60 ? nextLine : null,
            workload_hours: null,
            issue_date: null,
            start_date: null,
            end_date: null,
            credential_id: null,
            excerpt: `${line} na empresa ${nextLine}. ${nextNextLine}`,
            pageNumber: 1,
          });
          i += 1; // Pula linha complementar
        } else if (currentSection === "formacao" && nextLine.length > 0) {
          items.push({
            title: `${line} - ${nextLine}`,
            issuer: line,
            workload_hours: null,
            issue_date: null,
            start_date: null,
            end_date: null,
            credential_id: null,
            excerpt: `Formação: ${line}, ${nextLine}. ${nextNextLine}`,
            pageNumber: 1,
          });
          i += 1;
        } else if (currentSection === "certificacoes") {
          items.push({
            title: line,
            issuer: nextLine.length < 60 ? nextLine : "LinkedIn",
            workload_hours: null,
            issue_date: null,
            start_date: null,
            end_date: null,
            credential_id: null,
            excerpt: `Certificação: ${line}. Emissor: ${nextLine}`,
            pageNumber: 1,
          });
        }
      }
    }

    return {
      success: true,
      profileUrl: url,
      requiresAssistedExport: false,
      evidenceItems: items,
      message: `${items.length} evidências estruturadas foram extraídas do perfil do LinkedIn.`,
    };
  }
}
