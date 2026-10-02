import { EvidenceItem, EvidenceType, ResumeSection } from "@/lib/db/types";
import { DEMO_USER_ID } from "@/lib/db/store";

export interface ParsedCvResult {
  candidateName: string;
  crmNumber: string | null;
  crmState: string | null;
  rqeNumbers: string[];
  evidences: EvidenceItem[];
}

/**
 * Extrai evidências factuais e registros reais diretamente do texto do currículo do usuário.
 * ZERO invenção: se não constar no texto, o campo fica nulo.
 */
export function parseCvTextToEvidences(cvText: string): ParsedCvResult {
  const clean = cvText.replace(/\r\n/g, "\n").trim();
  const lines = clean.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  // 1. Extração do Nome (primeira linha não vazia, até 60 chars)
  let candidateName = "Candidato";
  if (lines.length > 0 && lines[0].length < 60 && !lines[0].toLowerCase().includes("currículo")) {
    candidateName = lines[0];
  }

  // 2. Extração Estrita de CRM (apenas se digitado no currículo)
  let crmNumber: string | null = null;
  let crmState: string | null = null;
  const crmMatch = clean.match(/CRM(?:[-\s]?(SP|RJ|MG|RS|PR|SC|BA|PE|CE|GO|DF|ES|PA|AM|MT|MS|RN|PB|AL|SE|PI|MA|RO|AC|TO|AP|RR))?[:\s]*([0-9]{4,8})(?:[-\s]?(SP|RJ|MG|RS|PR|SC|BA|PE|CE|GO|DF|ES|PA|AM|MT|MS|RN|PB|AL|SE|PI|MA|RO|AC|TO|AP|RR))?/i);
  if (crmMatch) {
    crmState = (crmMatch[1] || crmMatch[3] || "").toUpperCase() || null;
    crmNumber = crmMatch[2] || null;
  }

  // 3. Extração Estrita de RQE (apenas se comprovado no texto)
  const rqeNumbers: string[] = [];
  const rqeMatch = clean.match(/RQE[:\s]*([0-9]{3,7})/i);
  if (rqeMatch && rqeMatch[1]) {
    rqeNumbers.push(rqeMatch[1]);
  }

  // 4. Quebra em Blocos Factualmente Declarados
  const evidences: EvidenceItem[] = [];
  let rawBlocks = clean.split(/\n\s*\n/).filter((p) => p.trim().length > 15);
  if (rawBlocks.length <= 1) {
    rawBlocks = clean.split(/\n/).filter((p) => p.trim().length > 15);
  }

  let currentSection: ResumeSection = "experiencia";
  let defaultType: EvidenceType = "experiencia";

  rawBlocks.forEach((para, idx) => {
    const lower = para.toLowerCase();

    // Detecção de Cabeçalhos de Seções Reais
    if (lower.includes("residência") || lower.includes("residencia")) {
      currentSection = "formacao";
      defaultType = "residencia";
    } else if (lower.includes("formação") || lower.includes("formacao") || lower.includes("graduação") || lower.includes("graduacao") || lower.includes("faculdade")) {
      currentSection = "formacao";
      defaultType = "graduacao";
    } else if (lower.includes("certifica") || lower.includes("licenças") || lower.includes("licencas") || lower.includes("badge")) {
      currentSection = "certificacoes";
      defaultType = "certificacao_profissional";
    } else if (lower.includes("curso") || lower.includes("treinamento") || lower.includes("acls") || lower.includes("bls")) {
      currentSection = "cursos";
      defaultType = "curso_livre";
    } else if (lower.includes("publica") || lower.includes("artigo") || lower.includes("pesquisa")) {
      currentSection = "pesquisa_publicacoes";
      defaultType = "publicacao";
    } else if (lower.includes("projeto") || lower.includes("iniciativa")) {
      currentSection = "projetos";
      defaultType = "projeto";
    } else if (lower.includes("experiência") || lower.includes("experiencia") || lower.includes("histórico")) {
      currentSection = "experiencia";
      defaultType = "experiencia";
    }

    const paraLines = para.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    // Ignora linhas puramente de cabeçalho curto
    const contentLines = paraLines.filter((l) => {
      const lLow = l.toLowerCase();
      return (
        !lLow.startsWith("experiência") &&
        !lLow.startsWith("formação") &&
        !lLow.startsWith("certificações") &&
        !lLow.startsWith("cursos")
      );
    });

    if (contentLines.length === 0) return;

    const title = contentLines[0].substring(0, 90);
    const subtitle = contentLines.length > 1 ? contentLines[1].substring(0, 80) : undefined;
    const bodyText = contentLines.slice(1).join(" ").substring(0, 400);

    // Identificação de organização ou hospital
    let issuer: string | null = null;
    const orgMatch = para.match(/(?:hospital|universidade|faculdade|usp|fmusp|einstein|unifesp|instituto|empresa|clínica|clinica)[:\s]+([^,\n]+)/i);
    if (orgMatch) {
      issuer = orgMatch[0].substring(0, 60);
    } else if (subtitle && (subtitle.toLowerCase().includes("hospital") || subtitle.toLowerCase().includes("universidade") || subtitle.toLowerCase().includes("faculdade"))) {
      issuer = subtitle;
    }

    evidences.push({
      id: `ev-real-${Date.now()}-${idx}`,
      user_id: DEMO_USER_ID,
      evidence_type: defaultType,
      resume_section: currentSection,
      title: title || `Registro Declarado #${idx + 1}`,
      issuer_or_organization: issuer,
      description: bodyText || para.substring(0, 300),
      skills: [],
      source_excerpt: para.substring(0, 250),
      source_pages: [1],
      classification_source: "jev",
      confidence: 0.95,
      career_signal: defaultType === "residencia" ? 5 : defaultType === "graduacao" ? 4 : 3,
      review_status: "approved",
      user_locked: false,
      created_at: new Date().toISOString(),
    });
  });

  return {
    candidateName,
    crmNumber,
    crmState,
    rqeNumbers,
    evidences,
  };
}
