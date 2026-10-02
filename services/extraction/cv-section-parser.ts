import { EvidenceItem, EvidenceType, ResumeSection } from "@/lib/db/types";
import { DEMO_USER_ID } from "@/lib/db/store";
import crypto from "crypto";

export interface ParsedCvResult {
  candidateName: string;
  crmNumber: string | null;
  crmState: string | null;
  rqeNumbers: string[];
  evidences: EvidenceItem[];
}

/**
 * Extrai evidências factuais e registros reais diretamente do texto do currículo do usuário.
 * Suporta português e inglês, seções formais, listas de habilidades, idiomas e projetos.
 * ZERO invenção: fundamentado exclusivamente no texto fornecido.
 */
export function parseCvTextToEvidences(cvText: string): ParsedCvResult {
  const clean = cvText.replace(/\r\n/g, "\n").trim();
  const lines = clean
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Extração do Nome (primeira linha válida até 60 caracteres)
  let candidateName = "Candidato";
  const firstNonEmpty = lines.find(
    (l) =>
      l.length > 3 &&
      l.length < 60 &&
      !l.toLowerCase().includes("currículo") &&
      !l.toLowerCase().includes("curriculum") &&
      !l.toLowerCase().includes("resume")
  );
  if (firstNonEmpty) {
    candidateName = firstNonEmpty;
  }

  // 2. Extração Estrita de CRM
  let crmNumber: string | null = null;
  let crmState: string | null = null;
  const crmMatch = clean.match(
    /CRM(?:[-\s]?(SP|RJ|MG|RS|PR|SC|BA|PE|CE|GO|DF|ES|PA|AM|MT|MS|RN|PB|AL|SE|PI|MA|RO|AC|TO|AP|RR))?[:\s]*([0-9]{4,8})(?:[-\s]?(SP|RJ|MG|RS|PR|SC|BA|PE|CE|GO|DF|ES|PA|AM|MT|MS|RN|PB|AL|SE|PI|MA|RO|AC|TO|AP|RR))?/i
  );
  if (crmMatch) {
    crmState = (crmMatch[1] || crmMatch[3] || "").toUpperCase() || null;
    crmNumber = crmMatch[2] || null;
  }

  // 3. Extração Estrita de RQE
  const rqeNumbers: string[] = [];
  const rqeMatch = clean.match(/RQE[:\s]*([0-9]{3,7})/i);
  if (rqeMatch && rqeMatch[1]) {
    rqeNumbers.push(rqeMatch[1]);
  }

  // Definição bilíngue de cabeçalhos de seções
  const sectionKeywords = [
    {
      key: "resumo",
      section: "experiencia" as ResumeSection,
      type: "experiencia" as EvidenceType,
      regex:
        /^(professional summary|resumo profissional|resumo|perfil profissional|perfil|summary|about me)/i,
    },
    {
      key: "experiencia",
      section: "experiencia" as ResumeSection,
      type: "experiencia" as EvidenceType,
      regex:
        /^(work experience|professional experience|experiência profissional|experiencia profissional|experiência|experiencia|atuação profissional|historico profissional|work history|employment|clinical experience)/i,
    },
    {
      key: "projetos",
      section: "projetos" as ResumeSection,
      type: "projeto" as EvidenceType,
      regex:
        /^(medical ai project|projects|projetos|projetos aplicados|iniciativas|side projects|framework)/i,
    },
    {
      key: "formacao",
      section: "formacao" as ResumeSection,
      type: "graduacao" as EvidenceType,
      regex:
        /^(education|formação acadêmica|formacao academica|formação|formacao|graduação|graduacao|academic background|educação)/i,
    },
    {
      key: "residencia",
      section: "formacao" as ResumeSection,
      type: "residencia" as EvidenceType,
      regex:
        /^(medical residency|residência médica|residencia medica|residência|residencia)/i,
    },
    {
      key: "idiomas",
      section: "idiomas" as ResumeSection,
      type: "idioma" as EvidenceType,
      regex: /^(languages|idiomas|línguas|linguas)/i,
    },
    {
      key: "habilidades",
      section: "experiencia" as ResumeSection,
      type: "experiencia" as EvidenceType,
      regex:
        /^(skills & licenses|skills & certifications|skills|habilidades|competências|competencias|ferramentas|technologies)/i,
    },
    {
      key: "certificacoes",
      section: "certificacoes" as ResumeSection,
      type: "certificacao_profissional" as EvidenceType,
      regex:
        /^(certifications|certificações|certificacoes|licenses|licenças|licencas|registros)/i,
    },
    {
      key: "cursos",
      section: "cursos" as ResumeSection,
      type: "curso_livre" as EvidenceType,
      regex:
        /^(courses|cursos|treinamentos|training|cursos livres|aperfeiçoamento)/i,
    },
    {
      key: "publicacoes",
      section: "pesquisa_publicacoes" as ResumeSection,
      type: "publicacao" as EvidenceType,
      regex:
        /^(publications|publicações|publicacoes|artigos|papers|research|produção científica)/i,
    },
  ];

  // Agrupa linhas por seções detectadas
  interface DetectedSection {
    meta: (typeof sectionKeywords)[0];
    header: string;
    lines: string[];
  }

  const sections: DetectedSection[] = [];
  let currentSec: DetectedSection | null = null;

  for (const line of lines) {
    const matchedSec = sectionKeywords.find((s) => s.regex.test(line));
    if (matchedSec) {
      currentSec = {
        meta: matchedSec,
        header: line,
        lines: [],
      };
      sections.push(currentSec);
      continue;
    }

    if (currentSec) {
      currentSec.lines.push(line);
    }
  }

  const evidences: EvidenceItem[] = [];

  // Se não detectou seções explícitas, quebra por parágrafos
  if (sections.length === 0) {
    const blocks = clean.split(/\n\s*\n/).filter((b) => b.trim().length > 15);
    blocks.forEach((para, idx) => {
      evidences.push({
        id: crypto.randomUUID(),
        user_id: DEMO_USER_ID,
        evidence_type: "experiencia",
        resume_section: "experiencia",
        title: `Experiência Declarada #${idx + 1}`,
        issuer_or_organization: null,
        description: para,
        skills: [],
        source_excerpt: para.substring(0, 300),
        source_pages: [1],
        classification_source: "jev",
        confidence: 0.92,
        career_signal: 3,
        review_status: "approved",
        user_locked: false,
        created_at: new Date().toISOString(),
      });
    });

    return { candidateName, crmNumber, crmState, rqeNumbers, evidences };
  }

  // Processa cada seção identificada
  for (const sec of sections) {
    const meta = sec.meta;

    if (meta.key === "idiomas") {
      for (const line of sec.lines) {
        const cleanLine = line.replace(/^[-•*]\s*/, "").trim();
        if (cleanLine.length < 3) continue;
        const [lang, level] = cleanLine.split(/[:\-–]/).map((s) => s.trim());
        evidences.push({
          id: crypto.randomUUID(),
          user_id: DEMO_USER_ID,
          evidence_type: "idioma",
          resume_section: "idiomas",
          title: lang || cleanLine,
          issuer_or_organization: null,
          description: level ? `Nível de proficiência: ${level}` : cleanLine,
          skills: [],
          source_excerpt: cleanLine,
          source_pages: [1],
          classification_source: "jev",
          confidence: 0.96,
          career_signal: 4,
          review_status: "approved",
          user_locked: false,
          created_at: new Date().toISOString(),
        });
      }
    } else if (meta.key === "habilidades" || meta.key === "certificacoes") {
      for (const line of sec.lines) {
        const cleanLine = line.replace(/^[-•*]\s*/, "").trim();
        if (cleanLine.length < 3) continue;

        const isCert =
          /crm|rqe|acls|bls|certifica|licen|registration|council/i.test(
            cleanLine
          );
        const secName: ResumeSection = isCert ? "certificacoes" : "experiencia";
        const evType: EvidenceType = isCert
          ? "certificacao_profissional"
          : "experiencia";

        evidences.push({
          id: crypto.randomUUID(),
          user_id: DEMO_USER_ID,
          evidence_type: evType,
          resume_section: secName,
          title: cleanLine.split(/[:\-–]/)[0].trim().substring(0, 90),
          issuer_or_organization: isCert ? "Órgão Regulador / Certificadora" : null,
          description: cleanLine,
          skills: [],
          source_excerpt: cleanLine,
          source_pages: [1],
          classification_source: "jev",
          confidence: 0.95,
          career_signal: isCert ? 5 : 3,
          review_status: "approved",
          user_locked: false,
          created_at: new Date().toISOString(),
        });
      }
    } else {
      // Divide bloco por quebra de linha dupla ou por itens iniciados com títulos/anos
      const textBlock = sec.lines.join("\n");
      const blocks = textBlock.split(/\n\s*\n/).filter((b) => b.trim().length > 10);
      const subItems = blocks.length > 1 ? blocks : [textBlock];

      for (const itemText of subItems) {
        const itemLines = itemText
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        if (itemLines.length === 0) continue;

        const title = itemLines[0].substring(0, 90);
        const orgLine =
          itemLines.find((l) =>
            /(hospital|faculdade|universidade|clínica|empresa|instituto|ltda|ufmg|usp|unifesp|project|autonomous)/i.test(
              l
            )
          ) || (itemLines.length > 1 ? itemLines[1] : null);

        const description = itemLines.slice(1).join(" ").replace(/\s+/g, " ");

        evidences.push({
          id: crypto.randomUUID(),
          user_id: DEMO_USER_ID,
          evidence_type: meta.type,
          resume_section: meta.section,
          title,
          issuer_or_organization: orgLine ? orgLine.substring(0, 80) : null,
          description: description || title,
          skills: [],
          source_excerpt: itemText.substring(0, 300),
          source_pages: [1],
          classification_source: "jev",
          confidence: 0.95,
          career_signal: meta.section === "formacao" ? 5 : 4,
          review_status: "approved",
          user_locked: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  return { candidateName, crmNumber, crmState, rqeNumbers, evidences };
}
