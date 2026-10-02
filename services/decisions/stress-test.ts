import { getDecisionProvider } from "./index";

export interface StressTestDimension {
  key: string;
  label: string;
  score: number; // 0 a 100
  rawScore: number; // 0 a 4
  weight: number;
  confidence: number;
  assessment: string;
}

export type StressVerdict = "kill" | "fix" | "ship";

export interface StressTestResult {
  score: number; // 0 a 100
  verdict: StressVerdict;
  verdictLabel: string;
  verdictDescription: string;
  dimensions: StressTestDimension[];
  criticalGaps: string[];
  honestDiagnosis: string;
  roadmapToTarget: string[];
  allowResumeGeneration: boolean;
  model: string;
  latencyMs: number;
}

/**

 * Avalia currículo x vaga em 6 dimensões paralelas com notas 0 a 4.
 * Jamais dá falsas esperanças: se o perfil for discrepante, emite KILL.
 */
export async function runJevStressTest(
  candidateProfile: string,
  targetJob: string,
  jobUrl?: string
): Promise<StressTestResult> {
  const startTime = Date.now();
  const apiKey = process.env.TYPESAFE_API_KEY;
  const isEnabled = process.env.ENABLE_JEV === "true" && !!apiKey;

  // Se Jev estiver ativo e com chave, chama a API oficial da TypeSafe
  if (isEnabled && apiKey) {
    try {
      const payload = {
        state: {
          candidate_profile: candidateProfile.substring(0, 3000),
          target_job: targetJob.substring(0, 3000),
          job_url: jobUrl || null,
        },
        model: "jev-latest",
        questions: {
          profession_fit: {
            type: "score",
            instructions: "A profissão, formação base e área de atuação do candidato são compatíveis com o cargo?",
            criteria: [
              "Profissão totalmente discrepante (ex: Médico para Vendedor comercial, Advogado para Engenheiro)",
              "Profissão distante com quase nenhuma sobreposição de competências",
              "Profissões diferentes mas com habilidades parcialmente transferíveis",
              "Mesma área profissional e alta afinidade de formação",
              "Formação e profissão perfeitamente alinhadas com o cargo anunciado",
            ],
          },
          mandatory_skills: {
            type: "score",
            instructions: "O candidato comprova os requisitos obrigatórios, certificações e rotinas da vaga?",
            criteria: [
              "Nenhum dos requisitos obrigatórios é comprovado",
              "Atende a menos de 25% dos requisitos essenciais",
              "Atende a cerca de metade dos requisitos",
              "Atende à grande maioria dos requisitos essenciais",
              "Comprova integralmente todos os requisitos obrigatórios",
            ],
          },
          daily_activities: {
            type: "score",
            instructions: "O candidato tem histórico comprovado executando as atividades práticas do dia a dia da vaga?",
            criteria: [
              "Nunca executou as rotinas do cargo (ex: bater meta de vendas, prospecção comercial, telemarketing)",
              "Rotinas muito distantes com aplicabilidade remota",
              "Executou tarefas análogas em outro contexto profissional",
              "Executou a maior parte das rotinas exigidas no anúncio",
              "Domina as rotinas diárias e possui histórico consolidado",
            ],
          },
          fabrication_risk: {
            type: "score",
            instructions: "Qual a segurança de não precisar inventar experiência profissional para sustentar essa candidatura?",
            criteria: [
              "Risco extremo: exigiria inventar uma carreira e competências inexistentes",
              "Risco alto: faltam as competências nucleares do cargo",
              "Risco moderado: justificativas precisam ser forçadas",
              "Baixo risco: adaptação honesta baseada em fatos reais",
              "Risco zero: todos os fatos exigidos são comprovados documentalmente",
            ],
          },
          industry_fit: {
            type: "score",
            instructions: "O candidato possui vivência e repertório no mercado/setor de atuação da vaga?",
            criteria: [
              "Setor totalmente desconhecido pelo candidato",
              "Conhecimento apenas teórico ou superficial do mercado",
              "Setor correlato ou transferível",
              "Experiência prévia comprovada no mesmo segmento",
              "Especialista e referência consolidada no setor",
            ],
          },
          experience_depth: {
            type: "score",
            instructions: "O nível de senioridade e complexidade da trajetória do candidato sustenta a vaga?",
            criteria: [
              "Nenhuma experiência no escopo pretendido",
              "Experiência inicial ou distante do escopo da vaga",
              "Senioridade compatível mas em área adjacente",
              "Senioridade e profundidade sólidas e adequadas",
              "Senioridade sênior com liderança e domínio total",
            ],
          },
          verdict: {
            type: "choice",
            instructions: "Qual o veredito final estrito para essa candidatura (padrão kill/fix/ship)?",
            criteria: {
              kill: "NÃO RECOMENDADO / DESALINHADO: incompatibilidade crítica de perfil, risco de rejeição imediata e necessidade de inventar experiências.",
              fix: "PARCIAL / COM RESSALVAS: há habilidades transferíveis mas faltam requisitos essenciais que exigem capacitação prévia.",
              ship: "COMPATÍVEL / FORTE: candidato qualificado com evidências reais para concorrer com chances reais de entrevista.",
            },
          },
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const res = await fetch("https://api.typesafe.ai/v1/systemone", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const answers = data.answers || {};

        // Extrai scores 0 a 4
        const rawProfFit = answers.profession_fit?.score ?? 0;
        const rawMandSkills = answers.mandatory_skills?.score ?? 0;
        const rawDailyAct = answers.daily_activities?.score ?? 0;
        const rawFabRisk = answers.fabrication_risk?.score ?? 0;
        const rawIndFit = answers.industry_fit?.score ?? 0;
        const rawExpDepth = answers.experience_depth?.score ?? 0;

        const rawVerdict = answers.verdict?.choice || answers.verdict?.value || "kill";

        // Pesos das dimensões (profissão e requisitos obrigatórios pesam mais)
        const weights = {
          profession_fit: 2.5,
          mandatory_skills: 2.5,
          daily_activities: 2.0,
          fabrication_risk: 1.5,
          industry_fit: 1.0,
          experience_depth: 1.5,
        };

        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0); // 11.0
        const weightedScore =
          (rawProfFit * weights.profession_fit +
            rawMandSkills * weights.mandatory_skills +
            rawDailyAct * weights.daily_activities +
            rawFabRisk * weights.fabrication_risk +
            rawIndFit * weights.industry_fit +
            rawExpDepth * weights.experience_depth) /
          totalWeight;

        // Normaliza de 0-4 para 0-100%
        const finalScore = Math.round((weightedScore / 4) * 100);

        // Veredito estrito: se a profissão for discrepante (< 1.0) ou a nota for < 45, é KILL obrigatório
        let verdict: StressVerdict = "kill";
        if (finalScore >= 68 && rawVerdict === "ship" && rawProfFit >= 2.5) {
          verdict = "ship";
        } else if (finalScore >= 45 && rawProfFit >= 1.5) {
          verdict = "fix";
        } else {
          verdict = "kill";
        }

        const dimensions: StressTestDimension[] = [
          {
            key: "profession_fit",
            label: "Alinhamento de Profissão / Formação",
            rawScore: Number(rawProfFit.toFixed(2)),
            score: Math.round((rawProfFit / 4) * 100),
            weight: weights.profession_fit,
            confidence: answers.profession_fit?.confidence ?? 0.9,
            assessment:
              rawProfFit < 1.0
                ? "Profissão totalmente discrepante da exigida pela vaga."
                : rawProfFit < 2.5
                ? "Formação com pouca sobreposição direta."
                : "Formação altamente compatível.",
          },
          {
            key: "mandatory_skills",
            label: "Requisitos Obrigatórios Comprovados",
            rawScore: Number(rawMandSkills.toFixed(2)),
            score: Math.round((rawMandSkills / 4) * 100),
            weight: weights.mandatory_skills,
            confidence: answers.mandatory_skills?.confidence ?? 0.9,
            assessment:
              rawMandSkills < 1.0
                ? "Nenhum dos requisitos essenciais da vaga é comprovado pelo seu histórico."
                : rawMandSkills < 2.5
                ? "Atende a menos da metade dos requisitos exigidos."
                : "Comprova os requisitos centrais da oportunidade.",
          },
          {
            key: "daily_activities",
            label: "Histórico nas Rotinas Práticas do Cargo",
            rawScore: Number(rawDailyAct.toFixed(2)),
            score: Math.round((rawDailyAct / 4) * 100),
            weight: weights.daily_activities,
            confidence: answers.daily_activities?.confidence ?? 0.9,
            assessment:
              rawDailyAct < 1.0
                ? "Nunca executou as atividades e rotinas práticas descritas no anúncio."
                : rawDailyAct < 2.5
                ? "Executou apenas tarefas periféricas."
                : "Experiência consolidada nas rotinas do cargo.",
          },
          {
            key: "fabrication_risk",
            label: "Segurança Ética (Sem Invenção de Fatos)",
            rawScore: Number(rawFabRisk.toFixed(2)),
            score: Math.round((rawFabRisk / 4) * 100),
            weight: weights.fabrication_risk,
            confidence: answers.fabrication_risk?.confidence ?? 0.8,
            assessment:
              rawFabRisk < 1.0
                ? "Risco Crítico: Para aplicar, seria necessário inventar uma carreira não comprovada."
                : rawFabRisk < 2.5
                ? "Risco Elevado: adaptação exigiria forçar muito a barra."
                : "Totalmente seguro: histórico factual sólido.",
          },
          {
            key: "industry_fit",
            label: "Vivência no Setor / Mercado da Vaga",
            rawScore: Number(rawIndFit.toFixed(2)),
            score: Math.round((rawIndFit / 4) * 100),
            weight: weights.industry_fit,
            confidence: answers.industry_fit?.confidence ?? 0.8,
            assessment:
              rawIndFit < 1.0
                ? "Setor de atuação totalmente desconhecido pelo perfil."
                : rawIndFit < 2.5
                ? "Setor correlato com lacunas de mercado."
                : "Forte domínio e repertório no setor.",
          },
          {
            key: "experience_depth",
            label: "Profundidade de Senioridade",
            rawScore: Number(rawExpDepth.toFixed(2)),
            score: Math.round((rawExpDepth / 4) * 100),
            weight: weights.experience_depth,
            confidence: answers.experience_depth?.confidence ?? 0.8,
            assessment:
              rawExpDepth < 1.0
                ? "Senioridade nula no escopo da função."
                : rawExpDepth < 2.5
                ? "Senioridade apenas parcial."
                : "Senioridade plenamente aderente.",
          },
        ];

        return buildStressTestVerdict(verdict, finalScore, dimensions, Date.now() - startTime, "jev-1.13.0");
      }
    } catch (err: any) {
      console.warn("Jev API stress test falhou, usando fallback heurístico:", err.message);
    }
  }

  // Fallback determinístico rigoroso (estilo KillMyIdea)
  return runDeterministicStressTest(candidateProfile, targetJob, startTime);
}

/**
 * Constrói o diagnóstico sem alucinações conforme o veredito
 */
function buildStressTestVerdict(
  verdict: StressVerdict,
  finalScore: number,
  dimensions: StressTestDimension[],
  latencyMs: number,
  model: string
): StressTestResult {
  let verdictLabel = "🚨 DESALINHADO / NÃO RECOMENDADO";
  let verdictDescription =
    "O motor de decisão do JEV identificou incompatibilidade crítica entre o seu histórico e os requisitos fundamentais desta vaga. Não recomendamos a candidatura neste momento.";
  let allowResumeGeneration = false;

  const criticalGaps: string[] = [];
  const roadmapToTarget: string[] = [];

  if (verdict === "kill") {
    verdictLabel = "🚨 DESALINHADO / NÃO RECOMENDADO";
    verdictDescription =
      "O JEV avaliou a vaga e seu histórico com rigor máximo e concluiu que esta oportunidade pertence a uma carreira e rotina substancialmente diferentes da sua atuação comprovada. Gerar um currículo para esta vaga geraria rejeição imediata no recrutador por falta de requisitos essenciais.";
    allowResumeGeneration = false;

    criticalGaps.push(
      "Profissão e formação base totalmente incompatíveis com o cargo pretendido.",
      "Inexistência de comprovação documental nas rotinas diárias e ferramentas da vaga.",
      "Risco extremo de alucinação: adaptar o currículo exigiria criar cargos ou experiências fictícias."
    );

    roadmapToTarget.push(
      "Se você deseja realmente transicionar para esta área, precisará de uma formação base específica no segmento.",
      "Busque projetos práticos ou estágios iniciais para comprovar as rotinas do dia a dia.",
      "Para vagas imediatas, busque cargos que valorizem as evidências que você já possui comprovadas."
    );
  } else if (verdict === "fix") {
    verdictLabel = "⚠️ PARCIAL / REQUER AJUSTES E PONTES";
    verdictDescription =
      "Você possui competências parcialmente transferíveis para esta posição, porém há lacunas de ferramentas e experiência específica que serão questionadas pelo recrutador.";
    allowResumeGeneration = true;

    criticalGaps.push(
      "Faltam evidências documentais diretas em algumas ferramentas chave solicitadas.",
      "A senioridade na função pretendida precisará ser fortemente justificada por projetos práticos."
    );

    roadmapToTarget.push(
      "Realizar cursos livres ou certificações rápidas nas ferramentas específicas citadas no anúncio.",
      "Destacar no currículo os projetos onde você liderou tarefas análogas às responsabilidades da vaga."
    );
  } else {
    verdictLabel = "✅ COMPATÍVEL / FORTE CANDIDATURA";
    verdictDescription =
      "Excelente alinhamento! Suas evidências comprovadas sustentam diretamente os requisitos obrigatórios e a senioridade exigida pelo cargo.";
    allowResumeGeneration = true;

    roadmapToTarget.push(
      "Revisar o currículo adaptado para garantir que as palavras-chave do anúncio estejam em evidência.",
      "Utilizar as sugestões de headline no seu perfil do LinkedIn para aumentar a visibilidade perante o recrutador."
    );
  }

  const honestDiagnosis =
    verdict === "kill"
      ? `Aderência Factual de apenas ${finalScore}%. O SmartVitae bloqueia a geração de currículos inflados quando o JEV identifica um descompasso estrutural. Dizer a verdade sobre a sua aderência economiza seu tempo e preserva sua reputação profissional.`
      : verdict === "fix"
      ? `Aderência Factual estimada em ${finalScore}%. É uma vaga desafiadora que exigirá explicar como sua formação preenche parte dos requisitos, sem esconder as lacunas.`
      : `Aderência Factual de ${finalScore}%. Candidatura altamente recomendada com suporte documental sólido.`;

  return {
    score: finalScore,
    verdict,
    verdictLabel,
    verdictDescription,
    dimensions,
    criticalGaps,
    honestDiagnosis,
    roadmapToTarget,
    allowResumeGeneration,
    model,
    latencyMs,
  };
}

/**
 * Fallback determinístico rígido caso a API Jev esteja indisponível
 */
function runDeterministicStressTest(
  candidateProfile: string,
  targetJob: string,
  startTime: number
): StressTestResult {
  const cand = candidateProfile.toLowerCase();
  const job = targetJob.toLowerCase();

  // Teste de colisão de mundos (Ex: Médico vs Vendedor Comercial)
  const isCandidateDoctor = cand.includes("médic") || cand.includes("crm") || cand.includes("medicina") || cand.includes("clínica");
  const isJobSales = job.includes("vendedor") || job.includes("vendas") || job.includes("prospecção") || job.includes("comercial") || job.includes("concessionária") || job.includes("telemarketing");

  let score = 25;
  let verdict: StressVerdict = "kill";

  if (isCandidateDoctor && isJobSales && !cand.includes("vendas") && !cand.includes("comercial")) {
    score = 8;
    verdict = "kill";
  } else {
    // Cálculo heurístico de intersecção
    const jobWords = job
      .split(/[\s,.:;()/-]+/)
      .filter((w) => w.length > 3 && !["para", "com", "como", "mais", "sobre", "responsabilidades", "requisitos"].includes(w));
    
    let matches = 0;
    for (const w of jobWords) {
      if (cand.includes(w)) matches++;
    }

    const ratio = jobWords.length > 0 ? matches / jobWords.length : 0;
    score = Math.min(100, Math.round(ratio * 100 * 2));
    if (score < 40) verdict = "kill";
    else if (score < 65) verdict = "fix";
    else verdict = "ship";
  }

  const dimensions: StressTestDimension[] = [
    {
      key: "profession_fit",
      label: "Alinhamento de Profissão / Formação",
      rawScore: verdict === "kill" ? 0.1 : 3.0,
      score: verdict === "kill" ? 5 : 75,
      weight: 2.5,
      confidence: 0.95,
      assessment: verdict === "kill" ? "Profissão incompatível com o cargo." : "Área correlata.",
    },
    {
      key: "mandatory_skills",
      label: "Requisitos Obrigatórios Comprovados",
      rawScore: verdict === "kill" ? 0.2 : 2.5,
      score: verdict === "kill" ? 10 : 65,
      weight: 2.5,
      confidence: 0.9,
      assessment: verdict === "kill" ? "Faltam competências essenciais." : "Atende a requisitos parciais.",
    },
    {
      key: "daily_activities",
      label: "Histórico nas Rotinas Práticas do Cargo",
      rawScore: verdict === "kill" ? 0.0 : 2.0,
      score: verdict === "kill" ? 2 : 50,
      weight: 2.0,
      confidence: 0.9,
      assessment: verdict === "kill" ? "Nenhuma experiência nas tarefas práticas." : "Experiência transferível.",
    },
    {
      key: "fabrication_risk",
      label: "Segurança Ética (Sem Invenção de Fatos)",
      rawScore: verdict === "kill" ? 0.3 : 3.5,
      score: verdict === "kill" ? 15 : 85,
      weight: 1.5,
      confidence: 0.95,
      assessment: verdict === "kill" ? "Risco extremo de alucinação." : "Baixo risco de invenção.",
    },
    {
      key: "industry_fit",
      label: "Vivência no Setor / Mercado da Vaga",
      rawScore: verdict === "kill" ? 0.1 : 2.5,
      score: verdict === "kill" ? 5 : 65,
      weight: 1.0,
      confidence: 0.85,
      assessment: verdict === "kill" ? "Setor desconhecido." : "Setor próximo.",
    },
    {
      key: "experience_depth",
      label: "Profundidade de Senioridade",
      rawScore: verdict === "kill" ? 0.2 : 3.0,
      score: verdict === "kill" ? 10 : 75,
      weight: 1.5,
      confidence: 0.85,
      assessment: verdict === "kill" ? "Senioridade inadequada para o cargo." : "Senioridade compatível.",
    },
  ];

  return buildStressTestVerdict(verdict, score, dimensions, Date.now() - startTime, "deterministic-stress-engine");
}
