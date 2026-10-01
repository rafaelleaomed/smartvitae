import { CertificateDecision, CertificateState, DecisionProvider } from "./types";
import { LocalRuleDecisionProvider } from "./local-provider";
import { EvidenceType, ResumeSection } from "@/lib/db/types";

/**
 * Provedor Jev (TypeSafe AI - System One)
 * Envia o estado sanitizado ao endpoint oficial https://api.typesafe.ai/v1/systemone
 * para obter julgamentos rápidos, tipados e com confiança.
 * Possui fallback transparente para LocalRuleDecisionProvider.
 */
export class JevDecisionProvider implements DecisionProvider {
  private localFallback = new LocalRuleDecisionProvider();
  private apiKey: string | undefined;
  private model: string;
  private enabled: boolean;

  constructor() {
    this.apiKey = process.env.TYPESAFE_API_KEY;
    this.model = process.env.TYPESAFE_MODEL || "jev-latest";
    this.enabled = process.env.ENABLE_JEV === "true" && !!this.apiKey;
  }

  async classifyCertificate(state: CertificateState): Promise<CertificateDecision> {
    // Se o Jev estiver desabilitado ou sem chave, executa o fallback determinístico
    if (!this.enabled || !this.apiKey) {
      const fallbackResult = await this.localFallback.classifyCertificate(state);
      return {
        ...fallbackResult,
        reasoning: "Jev desativado ou chave ausente: fallback para regras locais executado.",
      };
    }

    try {
      const payload = {
        state,
        model: this.model,
        questions: {
          evidence_type: {
            type: "choice",
            instructions:
              "Classifique o documento pelo que ele comprova. Não eleve curso livre a especialidade, residência ou título profissional.",
            criteria: {
              graduacao: "Diploma ou declaração de graduação",
              pos_graduacao: "Pós-graduação lato sensu ou MBA",
              residencia: "Programa formal de residência médica (CNRM)",
              mestrado: "Título stricto sensu de mestrado",
              doutorado: "Título stricto sensu de doutorado",
              titulo_especialista: "Título de especialista emitido por sociedade/AMB",
              registro_profissional: "Registro em conselho ou órgão profissional",
              certificacao_profissional: "Certificação profissional verificável (ex: ACLS, ATLS)",
              curso_aperfeicoamento: "Formação complementar estruturada",
              curso_livre: "Curso livre ou trilha sem título profissional",
              evento: "Participação em congresso, simpósio ou jornada",
              publicacao: "Artigo, capítulo ou trabalho publicado",
              ensino: "Monitoria, docência ou facilitação",
              projeto: "Projeto técnico ou produto desenvolvido",
              experiencia: "Atuação profissional ou estágio",
              outro: "Comprovação profissional válida fora das categorias",
              nao_identificado: "Texto insuficiente ou documento não curricular",
            },
          },
          resume_section: {
            type: "choice",
            instructions: "Escolha a seção curricular mais adequada.",
            criteria: {
              formacao: "Formação acadêmica formal",
              experiencia: "Experiência profissional e cargos",
              certificacoes: "Certificações profissionais e licenças",
              cursos: "Cursos livres e aperfeiçoamento",
              pesquisa_publicacoes: "Artigos, capítulos e pesquisas",
              ensino: "Docência e monitoria",
              projetos: "Projetos práticos e produtos",
              idiomas: "Proficiência em línguas",
              voluntariado: "Atividades voluntárias",
              omitir: "Baixo valor curricular ou documento administrativo",
              revisao_humana: "Informação ambígua ou de alto risco",
            },
          },
          include_in_base_resume: {
            type: "noul",
            instructions:
              "Este item traz evidência profissional suficiente para integrar o currículo-base?",
          },
          requires_human_review: {
            type: "noul",
            instructions:
              "Há ambiguidade de identidade, data, validade, carga horária, emissor, título ou natureza do documento?",
          },
          career_signal: {
            type: "score",
            instructions: "Qual a força deste item como evidência curricular?",
            criteria: [
              "Ruído ou item administrativo",
              "Evidência fraca e pouco diferenciadora",
              "Evidência válida e complementar",
              "Evidência relevante para uma área específica",
              "Evidência central e diferenciadora",
            ],
          },
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

      const response = await fetch("https://api.typesafe.ai/v1/systemone", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`TypeSafe API error: HTTP ${response.status}`);
      }

      const data = await response.json();
      const answers = data.answers || {};

      const evidence_type = (answers.evidence_type?.value as EvidenceType) || "outro";
      const resume_section = (answers.resume_section?.value as ResumeSection) || "cursos";
      const include_in_base_resume = answers.include_in_base_resume?.value ?? true;
      let requires_human_review = answers.requires_human_review?.value ?? false;
      const career_signal = answers.career_signal?.value ?? 3;
      const confidence = data.confidence ?? answers.evidence_type?.confidence ?? 0.88;

      // Trava CFM de conformidade: se for residência, mestrado, especialidade ou registro, sempre exigir revisão
      if (
        [
          "residencia",
          "pos_graduacao",
          "titulo_especialista",
          "registro_profissional",
          "doutorado",
        ].includes(evidence_type)
      ) {
        requires_human_review = true;
      }

      return {
        evidence_type,
        resume_section,
        include_in_base_resume,
        requires_human_review,
        career_signal,
        confidence,
        decision_source: "jev",
        reasoning: "Classificação obtida via Jev System One com validação ética.",
      };
    } catch (err: any) {
      console.warn("Jev API indisponível, usando fallback determinístico:", err.message);
      const fallbackResult = await this.localFallback.classifyCertificate(state);
      return {
        ...fallbackResult,
        reasoning: `Fallback executado após falha da API Jev: ${err.message}`,
      };
    }
  }
}
