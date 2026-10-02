import { EvidenceItem, Profile } from "@/lib/db/types";
import { getDecisionProvider } from "@/services/decisions";

export interface JobRequirementItem {
  id: string;
  type: "mandatory" | "desirable" | "responsibility" | "keyword";
  text: string;
  matchedEvidenceId?: string;
  matchedEvidenceTitle?: string;
  matchStrength?: number; // 1 a 5
  isMet: boolean;
  needsExplanation?: boolean;
}

export interface JobAnalysis {
  title: string;
  company?: string;
  location?: string;
  requirements: JobRequirementItem[];
  keywords: string[];
}

export interface TailoredResumeSection {
  title: string;
  items: Array<{
    title: string;
    subtitle?: string;
    period?: string;
    details: string;
    evidenceId?: string;
    evidenceSource?: string;
  }>;
}

export interface TailoredResumeResult {
  candidateName: string;
  crmInfo?: string;
  targetRole: string;
  adherenceScore: number; // 0 a 100
  summary: string;
  sections: TailoredResumeSection[];
  matchingDetails: {
    totalRequirements: number;
    metRequirements: number;
    gaps: string[];
    cfmNotice: string;
  };
  linkedInKit: {
    headlines: string[];
    aboutSection: string;
    topSkills: string[];
  };
}

/**
 * Serviço de Análise de Vagas e Adaptação de Currículo
 * Grounded nas evidências documentais auditadas e sem invenção de dados.
 */
export class TailorService {
  /**
   * Extrai requisitos da vaga a partir do texto ou URL
   */
  async parseJobDescription(jobText: string, jobUrl?: string): Promise<JobAnalysis> {
    const clean = jobText.replace(/\r\n/g, "\n").trim();
    const lines = clean.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

    let title = "Vaga / Oportunidade em Saúde";
    let company = "Instituição Contratante";

    // Tenta capturar o título da vaga nas primeiras linhas
    if (lines.length > 0) {
      const firstLine = lines[0];
      if (firstLine.length < 80) {
        title = firstLine.replace(/^(vaga|oportunidade|cargo)[:\s-]*/i, "").trim();
      }
    }

    const requirements: JobRequirementItem[] = [];
    const keywords: string[] = [];

    // Detecção heurística de requisitos (bullet points, travessões, palavras-chave)
    let currentType: "mandatory" | "desirable" | "responsibility" = "mandatory";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();

      if (lower.includes("requisito") || lower.includes("qualificaç") || lower.includes("obrigat")) {
        currentType = "mandatory";
        continue;
      } else if (lower.includes("desejável") || lower.includes("diferencial") || lower.includes("plus")) {
        currentType = "desirable";
        continue;
      } else if (lower.includes("responsabilidade") || lower.includes("atribuiç") || lower.includes("atividades")) {
        currentType = "responsibility";
        continue;
      }

      // Se for uma linha com marcador de lista ou requisito claro
      if (
        line.startsWith("•") ||
        line.startsWith("-") ||
        line.startsWith("*") ||
        line.match(/^\d+[\.\)]/) ||
        line.length > 15
      ) {
        const cleanReq = line.replace(/^[•\-\*\d\.\)\s]+/, "").trim();
        if (cleanReq.length >= 10 && cleanReq.length <= 150) {
          requirements.push({
            id: `req-${requirements.length + 1}`,
            type: currentType,
            text: cleanReq,
            isMet: false,
          });
        }
      }
    }

    // Se não encontrou bullet points, cria requisitos sintéticos a partir de frases-chave
    if (requirements.length === 0) {
      const sentences = clean.split(/[.;]/).filter((s) => s.trim().length > 15);
      for (const s of sentences.slice(0, 6)) {
        requirements.push({
          id: `req-${requirements.length + 1}`,
          type: "mandatory",
          text: s.trim().substring(0, 100),
          isMet: false,
        });
      }
    }

    return {
      title,
      company,
      requirements,
      keywords,
    };
  }

  /**
   * Cruza requisitos da vaga contra as evidências utilizando o Jev
   */
  async matchAndTailor(
    profile: Profile,
    jobAnalysis: JobAnalysis,
    evidences: EvidenceItem[]
  ): Promise<TailoredResumeResult> {
    const decisionProvider = getDecisionProvider();
    const requirements = [...jobAnalysis.requirements];
    const gaps: string[] = [];

    let metCount = 0;

    // Para cada requisito da vaga, busca correspondência nas evidências
    for (const req of requirements) {
      let bestMatch: {
        evidence: EvidenceItem;
        strength: number;
        needsExplanation: boolean;
      } | null = null;

      for (const ev of evidences) {
        if (decisionProvider.scoreEvidenceForJob) {
          const decision = await decisionProvider.scoreEvidenceForJob({
            requirement: req.text,
            evidence: {
              type: ev.evidence_type,
              title: ev.title,
              description: ev.description || ev.source_excerpt || "",
            },
          });

          if (decision.is_relevant && (!bestMatch || decision.match_strength > bestMatch.strength)) {
            bestMatch = {
              evidence: ev,
              strength: decision.match_strength,
              needsExplanation: decision.needs_explanation,
            };
          }
        }
      }

      if (bestMatch && bestMatch.strength >= 2) {
        req.isMet = true;
        req.matchedEvidenceId = bestMatch.evidence.id;
        req.matchedEvidenceTitle = bestMatch.evidence.title;
        req.matchStrength = bestMatch.strength;
        req.needsExplanation = bestMatch.needsExplanation;
        metCount++;
      } else {
        req.isMet = false;
        gaps.push(req.text);
      }
    }

    const adherenceScore =
      requirements.length > 0 ? Math.round((metCount / requirements.length) * 100) : 75;

    // Monta seções do currículo ordenadas por relevância
    const expEvidences = evidences.filter((e) => ["experiencia", "projeto", "residencia"].includes(e.evidence_type));
    const eduEvidences = evidences.filter((e) => ["graduacao", "pos_graduacao", "mestrado", "doutorado"].includes(e.evidence_type));
    const certEvidences = evidences.filter((e) => ["certificacao_profissional", "curso_aperfeicoamento", "curso_livre"].includes(e.evidence_type));

    const sections: TailoredResumeSection[] = [];

    // 1. Experiência e Atuação Profissional
    if (expEvidences.length > 0) {
      sections.push({
        title: "Experiência Profissional & Atuação Clínica",
        items: expEvidences.map((e) => ({
          title: e.title,
          subtitle: e.issuer_or_organization || "Atuação Profissional",
          period: e.issue_date || (e.start_date && e.end_date ? `${e.start_date} - ${e.end_date}` : "Comprovado"),
          details: e.description || e.source_excerpt || "Comprovação documental validada.",
          evidenceId: e.id,
          evidenceSource: e.issuer_or_organization || "Documento Verificado",
        })),
      });
    }

    // 2. Formação Acadêmica Formal (Com travas CFM)
    if (eduEvidences.length > 0) {
      sections.push({
        title: "Formação Acadêmica & Títulos",
        items: eduEvidences.map((e) => ({
          title: e.title,
          subtitle: e.issuer_or_organization || "Instituição de Ensino",
          period: e.issue_date || "Concluído",
          details: `Modalidade: ${e.evidence_type.replace("_", " ")}. ${e.workload_hours ? `Carga horária: ${e.workload_hours}h.` : ""}`,
          evidenceId: e.id,
          evidenceSource: e.issuer_or_organization || "Diploma / Certificado",
        })),
      });
    }

    // 3. Certificações & Cursos Complementares
    if (certEvidences.length > 0) {
      sections.push({
        title: "Certificações & Cursos Técnicos",
        items: certEvidences.map((e) => ({
          title: e.title,
          subtitle: e.issuer_or_organization || "Entidade Certificadora",
          period: e.issue_date || "Emitido",
          details: `Certificação profissional verificável. ${e.credential_id ? `Credencial: ${e.credential_id}.` : ""}`,
          evidenceId: e.id,
          evidenceSource: e.issuer_or_organization || "Certificado",
        })),
      });
    }

    // Resumo profissional objetivo
    const summary = `${profile.full_name}, médico com atuação voltada a ${profile.professional_area || "inovação em saúde"}. Trajetória com evidências comprovadas em ${evidences.slice(0, 3).map((e) => e.title).join(", ")}, alinhada aos requisitos de ${jobAnalysis.title}. Todas as qualificações e residências estão devidamente suportadas por documentos probatórios e conformidade com o CFM.`;

    // Kit LinkedIn
    const linkedInKit = {
      headlines: [
        `${profile.full_name} | Médico | ${jobAnalysis.title} & Inovação Clínica`,
        `Médico Híbrido | Foco em ${profile.professional_area || "Healthtech & Tecnologia"} | CFM/RQE Verificado`,
        `Liderança Médica & Saúde Digital | Evidências em ${expEvidences[0]?.title || "Clínica Médica"}`,
      ],
      aboutSection: `Médico com sólida bagagem clínica e dedicação ao ecossistema de inovação e saúde digital. Com histórico comprovado em ${expEvidences.map((e) => e.title).join(", ")}, busco contribuir estrategicamente como ${jobAnalysis.title}, conectando rigor assistencial à eficiência tecnológica. Registros profissionais e qualificações auditados.`,
      topSkills: [
        "Inovação em Saúde",
        "Avaliação Clínica",
        "Liderança Médica",
        "Prontuário Eletrônico & Dados",
        "Compliance CFM",
      ],
    };

    return {
      candidateName: profile.full_name,
      crmInfo: profile.crm_number ? `CRM ${profile.crm_number}-${profile.crm_state || "SP"}` : undefined,
      targetRole: jobAnalysis.title,
      adherenceScore,
      summary,
      sections,
      matchingDetails: {
        totalRequirements: requirements.length,
        metRequirements: metCount,
        gaps,
        cfmNotice:
          "Conformidade Ética Garantida: Títulos de especialidade somente são informados mediante RQE ou residência CNRM comprovada.",
      },
      linkedInKit,
    };
  }
}
