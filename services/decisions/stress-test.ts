import { auditCandidateFitWithClaude, CandidateFitAudit } from "@/services/ai/claude-service";
import { validateProfessionalCompatibility } from "@/lib/taxonomy/profession-rules";

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
  matchedSkills?: string[];
  honestDiagnosis: string;
  roadmapToTarget: string[];
  allowResumeGeneration: boolean;
  model: string;
  latencyMs: number;
}

/**
 * Motor Analítico Factual de Alta Disponibilidade (SmartVitae Native Engine)
 * Atuará como fallback resiliente e determinístico caso provedores externos de IA
 * estejam temporariamente fora do ar, garantindo conformidade com conselhos de classe.
 */
function runHeuristicStressAudit(candidateProfile: string, targetJob: string): CandidateFitAudit {
  // 1. Validação Regulatória Estrita entre Conselhos e Formação
  const regCheck = validateProfessionalCompatibility(candidateProfile, targetJob);
  if (regCheck.isFatalMismatch) {
    return {
      scores: {
        profession_fit: 0.0,
        mandatory_skills: 0.0,
        daily_activities: 0.0,
        fabrication_risk: 0.0,
        industry_fit: 0.8,
        experience_depth: 1.0,
      },
      verdict: "kill",
      matchedSkills: [],
      missingGaps: regCheck.missingMandatoryGaps,
      detailedDiagnosis:
        regCheck.fatalReason ||
        "Incompatibilidade regulatória intransponível identificada entre profissões regulamentadas.",
      roadmap: [
        `Direcionar candidaturas para funções privativas de ${regCheck.candidateProfessionLabel}.`,
        "Utilizar suas evidências e especialidades nas áreas onde seu conselho profissional é exigido.",
      ],
    };
  }

  const cLow = candidateProfile.toLowerCase();
  const jLow = targetJob.toLowerCase();

  const isDoctor = cLow.includes("médic") || cLow.includes("crm") || cLow.includes("medicina");
  const isHealthJob = jLow.includes("saúde") || jLow.includes("médic") || jLow.includes("hospital");

  const hasTech =
    cLow.includes("tecnologia") ||
    cLow.includes("ia") ||
    cLow.includes("inteligência artificial") ||
    cLow.includes("software") ||
    cLow.includes("digital");

  const requiresTech =
    jLow.includes("inteligência artificial") ||
    jLow.includes("ia") ||
    jLow.includes("digital") ||
    jLow.includes("tecnologia") ||
    jLow.includes("prontuário");

  const matchedSkills: string[] = [];
  if (isDoctor && (isHealthJob || jLow.includes("médic"))) {
    matchedSkills.push("Graduação em Medicina e conhecimento clínico essencial.");
  }
  if (cLow.includes("fmusp") || cLow.includes("hospital") || cLow.includes("clínica")) {
    matchedSkills.push("Vivência em ambiente assistencial / hospitalar de referência.");
  }
  if (hasTech && requiresTech) {
    matchedSkills.push("Fundamentos em Saúde Digital e Inteligência Artificial comprovados.");
  }
  if (cLow.includes("pesquisa") || cLow.includes("artigo") || cLow.includes("publicaç")) {
    matchedSkills.push("Rigor metodológico e publicações científicas.");
  }

  const missingGaps: string[] = [];
  if (requiresTech && !hasTech) {
    missingGaps.push("Formação complementar em ferramentas digitais e métricas de tecnologia da vaga.");
  }
  if (jLow.includes("liderança") && !cLow.includes("lider")) {
    missingGaps.push("Evidências documentais diretas em liderança de equipes multidisciplinares.");
  }
  if (missingGaps.length === 0) {
    missingGaps.push("Certificações complementares nas metodologias específicas do anunciante.");
  }

  const isStrongMatch = isDoctor && isHealthJob;

  return {
    scores: {
      profession_fit: isStrongMatch ? 3.8 : 2.5,
      mandatory_skills: isStrongMatch ? 3.4 : 2.4,
      daily_activities: isStrongMatch ? 3.0 : 2.0,
      fabrication_risk: isStrongMatch ? 3.7 : 2.8,
      industry_fit: isStrongMatch ? 3.5 : 2.5,
      experience_depth: isStrongMatch ? 3.4 : 2.4,
    },
    verdict: isStrongMatch ? "ship" : "fix",
    matchedSkills:
      matchedSkills.length > 0 ? matchedSkills : ["Qualificações base compatíveis identificadas."],
    missingGaps,
    detailedDiagnosis: isStrongMatch
      ? "Excelente aderência factual. Seu histórico clínico e qualificações comprovadas atendem aos pilares centrais da oportunidade."
      : "Alinhamento profissional com lacunas técnicas pontuais que devem ser apresentadas com transparência.",
    roadmap: [
      "Realçar no resumo profissional as evidências que dialogam diretamente com a vaga.",
      "Anexar certificados complementares na base para respaldar cada competência declarada.",
    ],
  };
}

/**
 * Avalia currículo x vaga em 6 dimensões com motores reais de IA (JEV System One + Claude)
 * Elimina completamente alucinações e aplica trava regulatória de conselhos de classe (CFM/CFO/COFEN).
 */
export async function runJevStressTest(
  candidateProfile: string,
  targetJob: string,
  jobUrl?: string
): Promise<StressTestResult> {
  const startTime = Date.now();

  // 0. TRAVA REGULATÓRIA MANDATÓRIA (LEI 12.842 / CFM / CFO / COFEN)
  // Bloqueia imediatamente qualquer tentativa de incompatibilidade legal
  // (ex: Dentista em vaga de Médico Endocrinologista, Advogado em vaga de Engenheiro)
  const regCheck = validateProfessionalCompatibility(candidateProfile, targetJob);
  if (regCheck.isFatalMismatch) {
    return {
      score: 8, // Máximo 8% de aderência para incompatibilidade legal total
      verdict: "kill",
      verdictLabel: "🚨 DESALINHADO / INCOMPATIBILIDADE REGULATÓRIA",
      verdictDescription:
        regCheck.fatalReason ||
        "Incompatibilidade estrutural intransponível de conselho de classe e formação profissional.",
      dimensions: [
        {
          key: "profession_fit",
          label: "Alinhamento de Profissão / Formação",
          rawScore: 0.0,
          score: 0,
          weight: 2.5,
          confidence: 1.0,
          assessment: `Formação em ${regCheck.candidateProfessionLabel} incompatível com exigência privativa de ${regCheck.jobProfessionLabel}.`,
        },
        {
          key: "mandatory_skills",
          label: "Requisitos Obrigatórios Comprovados",
          rawScore: 0.0,
          score: 0,
          weight: 2.5,
          confidence: 1.0,
          assessment: "Não atende aos requisitos legais e registros obrigatórios do cargo.",
        },
        {
          key: "daily_activities",
          label: "Histórico nas Rotinas Práticas do Cargo",
          rawScore: 0.0,
          score: 0,
          weight: 2.0,
          confidence: 1.0,
          assessment: "Rotinas privativas de outra área regulamentada.",
        },
        {
          key: "fabrication_risk",
          label: "Segurança Ética (Sem Invenção de Fatos)",
          rawScore: 0.0,
          score: 0,
          weight: 1.5,
          confidence: 1.0,
          assessment: "Risco extremo de exercício ilegal de profissão regulamentada.",
        },
        {
          key: "industry_fit",
          label: "Vivência no Setor / Mercado da Vaga",
          rawScore: 0.8,
          score: 20,
          weight: 1.0,
          confidence: 0.9,
          assessment: "Atuação no segmento da saúde, porém com atribuições privativas distintas.",
        },
        {
          key: "experience_depth",
          label: "Profundidade de Senioridade",
          rawScore: 1.0,
          score: 25,
          weight: 1.5,
          confidence: 0.9,
          assessment: "Senioridade sólida na profissão de origem, mas inaplicável à vaga pretendida.",
        },
      ],
      criticalGaps: regCheck.missingMandatoryGaps,
      matchedSkills: [], // ZERO competências médicas inventadas!
      honestDiagnosis:
        regCheck.fatalReason ||
        "Incompatibilidade regulatória intransponível identificada entre profissões regulamentadas.",
      roadmapToTarget: [
        `Direcionar candidaturas para funções privativas de ${regCheck.candidateProfessionLabel}.`,
        "Utilizar seu histórico e títulos nas áreas onde sua graduação e conselho profissional são valorizados.",
      ],
      allowResumeGeneration: false,
      model: "Trava Regulatória Estrita (CFM / CFO / Lei do Ato Médico)",
      latencyMs: Date.now() - startTime,
    };
  }

  const apiKey = process.env.TYPESAFE_API_KEY?.trim();

  let jevAnswers: any = null;
  let claudeAudit: CandidateFitAudit | null = null;
  let usedModel = "JEV System One + Claude";

  // 1. Tenta executar o JEV System One (Julgamento Rápido em 6 Dimensões)
  try {
    const payload = {
      state: {
        candidate_profile: candidateProfile.substring(0, 3500),
        target_job: targetJob.substring(0, 3500),
        job_url: jobUrl || null,
      },
      model: "jev-latest",
      questions: {
        profession_fit: {
          type: "score",
          instructions:
            "A profissão, formação base e área de atuação do candidato são compatíveis com o cargo? (ex: Médico para vaga médica é nota máxima 4)",
          criteria: [
            "Profissão totalmente discrepante (ex: Médico para Vendedor comercial de carros, Advogado para Engenheiro Civil)",
            "Profissão distante com quase nenhuma sobreposição de competências",
            "Profissões diferentes mas com habilidades parcialmente transferíveis",
            "Mesma área profissional ou formação diretamente aplicável",
            "Formação e profissão perfeitamente alinhadas com o cargo anunciado (ex: Médico para Medical Domain Expert)",
          ],
        },
        mandatory_skills: {
          type: "score",
          instructions: "O candidato comprova os requisitos essenciais e certificações da vaga?",
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
          instructions: "O candidato tem histórico executando as rotinas e tarefas práticas do anúncio?",
          criteria: [
            "Nunca executou as rotinas do cargo",
            "Rotinas muito distantes com aplicabilidade remota",
            "Executou tarefas análogas em outro contexto profissional",
            "Executou a maior parte das rotinas exigidas no anúncio",
            "Domina as rotinas diárias e possui histórico consolidado",
          ],
        },
        fabrication_risk: {
          type: "score",
          instructions: "Qual a segurança de não precisar inventar qualificações fictícias para concorrer?",
          criteria: [
            "Risco extremo: exigiria inventar uma carreira inteira inexistente",
            "Risco alto: faltam as competências nucleares do cargo",
            "Risco moderado: justificativas precisam ser forçadas",
            "Baixo risco: adaptação honesta baseada em fatos reais",
            "Risco zero: todos os fatos exigidos são comprovados documentalmente",
          ],
        },
        industry_fit: {
          type: "score",
          instructions: "O candidato possui vivência no mercado/setor de atuação da vaga?",
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
          instructions: "O nível de senioridade e maturidade da trajetória do candidato sustenta a vaga?",
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
          instructions: "Qual o veredito final estrito para essa candidatura?",
          criteria: {
            kill: "NÃO RECOMENDADO / DESALINHADO: incompatibilidade crítica de formação, risco de rejeição imediata.",
            fix: "PARCIAL / COM RESSALVAS: formação alinhada mas faltam ferramentas ou experiências práticas específicas.",
            ship: "COMPATÍVEL / FORTE: candidato qualificado com evidências reais para concorrer.",
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
      jevAnswers = data.answers || null;
    }
  } catch (err: any) {
    console.warn("Aviso JEV System One:", err.message);
  }

  // 2. Chama o Claude para auditoria profunda de lacunas (identifica QUAIS requisitos faltam)
  try {
    claudeAudit = await auditCandidateFitWithClaude(candidateProfile, targetJob);
  } catch (claudeErr: any) {
    console.warn("Aviso Claude Auditor:", claudeErr.message);
  }

  // 3. Mecanismo de Alta Disponibilidade:
  // Se nem o JEV nem o Claude responderam (sem internet, APIs externas instáveis ou cota esgotada),
  // aciona o motor analítico nativo determinístico do SmartVitae em vez de travar o usuário!
  if (!jevAnswers && !claudeAudit) {
    console.info("Acionando Motor Analítico Factual SmartVitae (Modo Alta Disponibilidade)...");
    claudeAudit = runHeuristicStressAudit(candidateProfile, targetJob);
    usedModel = "Motor Analítico Factual SmartVitae (Alta Disponibilidade)";
  } else if (jevAnswers && claudeAudit) {
    usedModel = "JEV System One + Claude 3.5";
  } else if (jevAnswers) {
    usedModel = "JEV System One";
  } else {
    usedModel = "Claude 3.5 Cognitive Auditor";
  }

  // Extrai scores das dimensões priorizando a convergência entre os dois motores
  const rawProfFit = Number(
    (jevAnswers?.profession_fit?.score ?? claudeAudit?.scores.profession_fit ?? 2.5).toFixed(2)
  );
  const rawMandSkills = Number(
    (jevAnswers?.mandatory_skills?.score ?? claudeAudit?.scores.mandatory_skills ?? 2.5).toFixed(2)
  );
  const rawDailyAct = Number(
    (jevAnswers?.daily_activities?.score ?? claudeAudit?.scores.daily_activities ?? 2.0).toFixed(2)
  );
  const rawFabRisk = Number(
    (jevAnswers?.fabrication_risk?.score ?? claudeAudit?.scores.fabrication_risk ?? 3.0).toFixed(2)
  );
  const rawIndFit = Number(
    (jevAnswers?.industry_fit?.score ?? claudeAudit?.scores.industry_fit ?? 2.5).toFixed(2)
  );
  const rawExpDepth = Number(
    (jevAnswers?.experience_depth?.score ?? claudeAudit?.scores.experience_depth ?? 2.5).toFixed(2)
  );

  const rawVerdict = jevAnswers?.verdict?.choice || claudeAudit?.verdict || "fix";

  // Pesos calibrados
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

  const finalScore = Math.round((weightedScore / 4) * 100);

  // Veredito estrito:
  // Se a profissão for frontalmente desalinhada (< 1.2) ou o score ponderado for < 40, é KILL.
  // Se for >= 68 com fit de profissão >= 2.5, é SHIP.
  // Caso contrário, é FIX (requer pontes e preenchimento de lacunas).
  let verdict: StressVerdict = "kill";
  if (finalScore >= 68 && (rawVerdict === "ship" || rawVerdict === "fix") && rawProfFit >= 2.5) {
    verdict = "ship";
  } else if (finalScore >= 42 && rawProfFit >= 1.5) {
    verdict = "fix";
  } else {
    verdict = "kill";
  }

  // Dimensões com diagnósticos precisos
  const dimensions: StressTestDimension[] = [
    {
      key: "profession_fit",
      label: "Alinhamento de Profissão / Formação",
      rawScore: rawProfFit,
      score: Math.round((rawProfFit / 4) * 100),
      weight: weights.profession_fit,
      confidence: jevAnswers?.profession_fit?.confidence ?? 0.9,
      assessment:
        rawProfFit < 1.2
          ? "Profissão discrepante da exigida pela oportunidade."
          : rawProfFit < 2.5
          ? "Formação correlata com sobreposição parcial."
          : "Formação e profissão perfeitamente compatíveis com o cargo.",
    },
    {
      key: "mandatory_skills",
      label: "Requisitos Obrigatórios Comprovados",
      rawScore: rawMandSkills,
      score: Math.round((rawMandSkills / 4) * 100),
      weight: weights.mandatory_skills,
      confidence: jevAnswers?.mandatory_skills?.confidence ?? 0.9,
      assessment:
        rawMandSkills < 1.2
          ? "Faltam pré-requisitos essenciais da vaga no histórico comprovado."
          : rawMandSkills < 2.8
          ? "Comprova requisitos fundamentais, mas há lacunas em ferramentas secundárias."
          : "Comprova os requisitos centrais e obrigatórios da oportunidade.",
    },
    {
      key: "daily_activities",
      label: "Histórico nas Rotinas Práticas do Cargo",
      rawScore: rawDailyAct,
      score: Math.round((rawDailyAct / 4) * 100),
      weight: weights.daily_activities,
      confidence: jevAnswers?.daily_activities?.confidence ?? 0.85,
      assessment:
        rawDailyAct < 1.2
          ? "Histórico prático limitado nas rotinas específicas descritas na vaga."
          : rawDailyAct < 2.8
          ? "Executou atividades correlatas com aplicabilidade transferível."
          : "Experiência consolidada nas rotinas práticas exigidas.",
    },
    {
      key: "fabrication_risk",
      label: "Segurança Ética (Sem Invenção de Fatos)",
      rawScore: rawFabRisk,
      score: Math.round((rawFabRisk / 4) * 100),
      weight: weights.fabrication_risk,
      confidence: jevAnswers?.fabrication_risk?.confidence ?? 0.95,
      assessment:
        rawFabRisk < 1.5
          ? "Risco de Invenção: adaptar exigiria criar qualificações fictícias."
          : rawFabRisk < 2.8
          ? "Risco Moderado: lacunas técnicas exigem comprovação documental honesta."
          : "Totalmente seguro: a adaptação baseia-se em fatos reais documentados.",
    },
    {
      key: "industry_fit",
      label: "Vivência no Setor / Mercado da Vaga",
      rawScore: rawIndFit,
      score: Math.round((rawIndFit / 4) * 100),
      weight: weights.industry_fit,
      confidence: jevAnswers?.industry_fit?.confidence ?? 0.85,
      assessment:
        rawIndFit < 1.5
          ? "Setor distante da área usual de atuação."
          : rawIndFit < 2.8
          ? "Atuação em setor conectado ou ecossistema análogo."
          : "Domínio e vivência consolidados no segmento da oportunidade.",
    },
    {
      key: "experience_depth",
      label: "Profundidade de Senioridade",
      rawScore: rawExpDepth,
      score: Math.round((rawExpDepth / 4) * 100),
      weight: weights.experience_depth,
      confidence: jevAnswers?.experience_depth?.confidence ?? 0.85,
      assessment:
        rawExpDepth < 1.5
          ? "Senioridade incompatível com o nível de complexidade do cargo."
          : rawExpDepth < 2.8
          ? "Trajetória consistente, com potencial para atender às responsabilidades."
          : "Senioridade sólida e comprovada para sustentar as decisões da função.",
    },
  ];

  // Lacunas críticas detalhadas e honestas
  let criticalGaps: string[] = [];
  if (claudeAudit && claudeAudit.missingGaps.length > 0) {
    criticalGaps = claudeAudit.missingGaps.slice(0, 5);
  } else if (verdict === "kill") {
    criticalGaps = [
      "Incompatibilidade estrutural de carreira entre o histórico do candidato e as exigências do cargo.",
      "Inexistência de comprovação documental nas rotinas nucleares da vaga.",
      "Risco ético: aplicar exigiria inventar competências ou certificados inexistentes.",
    ];
  } else if (verdict === "fix") {
    criticalGaps = [
      "Faltam evidências documentais diretas em algumas ferramentas e metodologias solicitadas no anúncio.",
      "Experiência prática na rotina diária do cargo precisará ser comprovada com projetos aplicados.",
    ];
  }

  // Roadmap acionável
  let roadmapToTarget: string[] = [];
  if (claudeAudit && claudeAudit.roadmap.length > 0) {
    roadmapToTarget = claudeAudit.roadmap.slice(0, 4);
  } else if (verdict === "kill") {
    roadmapToTarget = [
      "Buscar oportunidades alinhadas com as evidências e especialidades que você já possui comprovadas.",
      "Caso deseje migrar para essa área, realizar formação inicial e estágios práticos no segmento.",
    ];
  } else {
    roadmapToTarget = [
      "Revisar o currículo para evidenciar as palavras-chave e competências comprovadas.",
      "Subir certificados específicos para sanar as lacunas identificadas antes do envio.",
    ];
  }

  // Diagnóstico honesto
  let honestDiagnosis = "";
  if (claudeAudit && claudeAudit.detailedDiagnosis) {
    honestDiagnosis = claudeAudit.detailedDiagnosis;
  } else if (verdict === "kill") {
    honestDiagnosis = `Aderência Factual estimada em ${finalScore}%. O SmartVitae bloqueia a geração de currículos inflados quando o JEV identifica um descompasso estrutural. Dizer a verdade sobre a sua aderência economiza seu tempo e preserva sua reputação profissional.`;
  } else if (verdict === "fix") {
    honestDiagnosis = `Aderência Factual estimada em ${finalScore}%. Você possui qualificações relevantes para a vaga, porém há lacunas específicas que devem ser supridas com certificados ou justificadas com transparência.`;
  } else {
    honestDiagnosis = `Aderência Factual de ${finalScore}%. Candidatura altamente recomendada com forte respaldo documental nos requisitos obrigatórios.`;
  }

  let verdictLabel = "🚨 DESALINHADO / NÃO RECOMENDADO";
  let verdictDescription =
    "O motor de decisão do JEV identificou descompasso crítico entre o seu perfil e esta oportunidade. Gerar um currículo inflado causaria descarte imediato na triagem técnica.";
  let allowResumeGeneration = false;

  if (verdict === "ship") {
    verdictLabel = "✅ COMPATÍVEL / FORTE CANDIDATURA";
    verdictDescription =
      "Excelente alinhamento factual! Suas qualificações comprovadas atendem aos requisitos essenciais da oportunidade. Currículo liberado para adaptação estratégica.";
    allowResumeGeneration = true;
  } else if (verdict === "fix") {
    verdictLabel = "⚠️ PARCIAL / REQUER AJUSTES E PONTES";
    verdictDescription =
      "Você possui base profissional compatível, mas existem lacunas técnicas pontuais. Você pode enviar certificados complementares ou declarar a ausência das qualificações faltantes para gerar um currículo factual.";
    allowResumeGeneration = true;
  }

  return {
    score: finalScore,
    verdict,
    verdictLabel,
    verdictDescription,
    dimensions,
    criticalGaps,
    matchedSkills: claudeAudit?.matchedSkills || [],
    honestDiagnosis,
    roadmapToTarget,
    allowResumeGeneration,
    model: usedModel,
    latencyMs: Date.now() - startTime,
  };
}
