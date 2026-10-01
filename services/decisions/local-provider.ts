import { CertificateDecision, CertificateState, DecisionProvider } from "./types";
import { EvidenceType, ResumeSection } from "@/lib/db/types";

/**
 * Provedor de Regras Determinísticas Locais (LocalRuleDecisionProvider)
 * Aplica conformidade médica CFM/MEC estrita e serve de fallback imediato caso
 * APIs de IA externas estejam offline ou sem chave configurada.
 */
export class LocalRuleDecisionProvider implements DecisionProvider {
  async classifyCertificate(state: CertificateState): Promise<CertificateDecision> {
    const text = `${state.normalized_title} ${state.document_label} ${state.text_excerpt}`.toLowerCase();
    const hours = state.workload_hours;

    let evidence_type: EvidenceType = "outro";
    let resume_section: ResumeSection = "cursos";
    let include_in_base_resume = true;
    let requires_human_review = false;
    let career_signal = 3;
    let confidence = 0.85;

    // Regra 1: Residência Médica (CNRM/MEC) - Alto risco, exige revisão de RQE
    if (text.includes("residência médica") || text.includes("residencia medica") || text.includes("programa de residência")) {
      evidence_type = "residencia";
      resume_section = "formacao";
      career_signal = 5;
      requires_human_review = true; // SEMPRE revisar especialidade e registro
      confidence = 0.95;
    }
    // Regra 2: Pós-graduação Lato Sensu (Especialização acadêmica)
    else if (text.includes("pós-graduação") || text.includes("pos-graduacao") || text.includes("lato sensu") || text.includes("mba")) {
      evidence_type = "pos_graduacao";
      resume_section = "formacao";
      career_signal = 4;
      requires_human_review = true; // Revisar para não confundir com RQE
      confidence = 0.90;
    }
    // Regra 3: Mestrado / Doutorado (Stricto Sensu)
    else if (text.includes("mestrado") || text.includes("mestre em")) {
      evidence_type = "mestrado";
      resume_section = "formacao";
      career_signal = 5;
      requires_human_review = true;
      confidence = 0.92;
    } else if (text.includes("doutorado") || text.includes("phd") || text.includes("doutor em")) {
      evidence_type = "doutorado";
      resume_section = "formacao";
      career_signal = 5;
      requires_human_review = true;
      confidence = 0.92;
    }
    // Regra 4: Graduação em Medicina ou correlata
    else if (text.includes("diploma de graduação") || text.includes("bacharel em medicina") || text.includes("conclusão de curso de medicina")) {
      evidence_type = "graduacao";
      resume_section = "formacao";
      career_signal = 5;
      requires_human_review = true;
      confidence = 0.95;
    }
    // Regra 5: Publicação Científica
    else if (text.includes("artigo publicado") || text.includes("revista científica") || text.includes("periódico") || text.includes("journal")) {
      evidence_type = "publicacao";
      resume_section = "pesquisa_publicacoes";
      career_signal = 4;
      confidence = 0.88;
    }
    // Regra 6: Participação em Congresso / Evento / Jornada
    else if (text.includes("congresso") || text.includes("simpósio") || text.includes("jornada") || text.includes("ouvinte") || text.includes("participou do evento")) {
      evidence_type = "evento";
      resume_section = "cursos";
      career_signal = 2; // Sinal baixo
      include_in_base_resume = false; // Itens de baixa diferenciação podem ser omitidos do currículo base
      confidence = 0.90;
    }
    // Regra 7: Certificação Profissional Verificável (ex: ACLS, ATLS, PALS, Google Cloud, AWS)
    else if (text.includes("acls") || text.includes("atls") || text.includes("pals") || text.includes("certified") || text.includes("certificação profissional")) {
      evidence_type = "certificacao_profissional";
      resume_section = "certificacoes";
      career_signal = 4;
      confidence = 0.90;
    }
    // Regra 8: Curso de Aperfeiçoamento (carga horária substancial >= 40h)
    else if (hours && hours >= 40) {
      evidence_type = "curso_aperfeicoamento";
      resume_section = "cursos";
      career_signal = 3;
      confidence = 0.85;
    }
    // Regra 9: Curso livre comum
    else if (text.includes("curso") || text.includes("workshop") || text.includes("treinamento")) {
      evidence_type = "curso_livre";
      resume_section = "cursos";
      career_signal = 2;
      confidence = 0.80;
    }

    return {
      evidence_type,
      resume_section,
      include_in_base_resume,
      requires_human_review,
      career_signal,
      confidence,
      decision_source: "local_rule",
      reasoning: "Classificação calculada pelo motor determinístico de regras locais.",
    };
  }
}
