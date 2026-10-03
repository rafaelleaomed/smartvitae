import { EvidenceItem, EvidenceType, ResumeSection } from "@/lib/db/types";
import { DEMO_USER_ID } from "@/lib/db/store";
import crypto from "crypto";

export interface StructuredCvResult {
  candidateName: string;
  crmNumber: string | null;
  crmState: string | null;
  rqeNumbers: string[];
  evidences: EvidenceItem[];
}

/**
 * Extrai bloco JSON com segurança de qualquer resposta textual de LLM
 * Inclui auto-recuperação caso a resposta tenha sido interrompida por limite de tokens
 */
function extractJsonFromText(text: string): any {
  if (!text) throw new Error("Resposta vazia da IA.");

  let clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const firstBrace = clean.indexOf("{");
  if (firstBrace === -1) throw new Error("Nenhum JSON encontrado.");
  clean = clean.substring(firstBrace);

  // 1. Tenta parse direto
  try {
    return JSON.parse(clean);
  } catch (initialErr) {
    // 2. Se falhou (geralmente por truncamento do array de evidences), tenta auto-fechamento
    const lastObjEnd = clean.lastIndexOf("}");
    if (lastObjEnd !== -1) {
      const candidate = clean.substring(0, lastObjEnd + 1);
      const repairAttempts = [
        candidate,
        candidate + "\n  ]\n}",
        candidate + "\n}",
        clean.substring(0, clean.lastIndexOf(",")) + "\n  ]\n}",
      ];

      for (const attempt of repairAttempts) {
        try {
          return JSON.parse(attempt);
        } catch {
          // segue tentando próximo
        }
      }
    }

    throw new Error("Não foi possível decodificar os dados retornados pela inteligência.");
  }
}

/**
 * Chamada Direta e Resiliente à API Oficial do Google Gemini
 * Utiliza o modelo gemini-flash-latest com a chave GEMINI_API_KEY configurada,
 * garantindo zero alucinação, alta velocidade e operando sem intermediários.
 */
export async function callGeminiDirect(
  systemPrompt: string,
  userPrompt: string,
  options: {
    maxTokens?: number;
    temperature?: number;
    json?: boolean;
  } = {}
): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (!geminiKey) {
    throw new Error("Chave GEMINI_API_KEY não configurada nas variáveis de ambiente.");
  }

  const payload: any = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.1,
      maxOutputTokens: options.maxTokens ?? 1500,
      ...(options.json ? { responseMimeType: "application/json" } : {}),
    },
  };

  const modelsToTry = ["gemini-flash-latest", "gemini-pro-latest", "gemini-2.5-flash-lite"];
  let lastErr = "";

  for (const model of modelsToTry) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } else {
        lastErr = `${model} (${res.status}): ${await res.text()}`;
      }
    } catch (e: any) {
      lastErr = `${model}: ${e.message}`;
    }
  }

  throw new Error(`Falha na API Google Gemini: ${lastErr}`);
}

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  options: {
    maxTokens?: number;
    temperature?: number;
    json?: boolean;
    useSonnet?: boolean;
  } = {}
): Promise<string> {
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const geminiDirectKey = process.env.GEMINI_API_KEY?.trim();

  // Se não houver OpenRouter mas houver Gemini direto, executa diretamente via Google
  if (!openRouterKey && geminiDirectKey) {
    console.info("Utilizando motor Google Gemini direto (GEMINI_API_KEY)...");
    return await callGeminiDirect(systemPrompt, userPrompt, options);
  }

  if (!openRouterKey && !geminiDirectKey) {
    throw new Error("Nenhum provedor de IA configurado (configure OPENROUTER_API_KEY ou GEMINI_API_KEY).");
  }

  const requestedTokens = options.maxTokens || 420;
  const isLargeGeneration = requestedTokens > 450;

  const preferredModel = isLargeGeneration
    ? "google/gemini-2.5-flash"
    : options.useSonnet
    ? "anthropic/claude-sonnet-4.5"
    : "anthropic/claude-haiku-4.5";

  const primarySafeTokens = preferredModel.startsWith("anthropic/")
    ? Math.min(requestedTokens, 450)
    : preferredModel.startsWith("google/")
    ? Math.min(requestedTokens, 800)
    : Math.min(requestedTokens, 1500);

  const requestBody: any = {
    model: preferredModel,
    temperature: options.temperature ?? 0.1,
    max_tokens: primarySafeTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };

  if (options.json) {
    requestBody.response_format = { type: "json_object" };
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "SmartVitae",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    }

    const errText = await res.text();
    console.warn(`Aviso no modelo ${preferredModel} (${res.status}):`, errText);
  } catch (err: any) {
    console.warn(`Falha na chamada principal ${preferredModel}:`, err.message);
  }

  // Fallback 1: Google Gemini Direto (Oficial Google, sem intermediários)
  if (geminiDirectKey) {
    try {
      console.info("Acionando fallback para Google Gemini Direto (API Oficial)...");
      return await callGeminiDirect(systemPrompt, userPrompt, options);
    } catch (gErr: any) {
      console.warn("Fallback Google Gemini direto falhou:", gErr.message);
    }
  }

  // Fallback 2: Claude Haiku 4.5 (se tentou Sonnet antes via OpenRouter)
  if (options.useSonnet && openRouterKey) {
    try {
      console.info("Acionando fallback para Claude Haiku 4.5...");
      const fbClaude = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "SmartVitae Fallback",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...requestBody,
          model: "anthropic/claude-haiku-4.5",
          max_tokens: Math.min(requestedTokens, 450),
        }),
      });

      if (fbClaude.ok) {
        const data = await fbClaude.json();
        return data.choices?.[0]?.message?.content || "";
      }
    } catch (e: any) {
      console.warn("Fallback Claude Haiku falhou:", e.message);
    }
  }

  // Fallback 3: Llama 3.3 70B (Alta capacidade)
  if (openRouterKey) {
    try {
      console.info("Acionando fallback resiliente Llama 3.3 70B...");
      const fbLlama = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "SmartVitae Resilient Fallback",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct",
          temperature: options.temperature ?? 0.1,
          max_tokens: Math.min(requestedTokens, 1500),
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          ...(options.json ? { response_format: { type: "json_object" } } : {}),
        }),
      });

      if (fbLlama.ok) {
        const llamaData = await fbLlama.json();
        return llamaData.choices?.[0]?.message?.content || "";
      }
    } catch (llamaErr: any) {
      console.error("Erro no fallback Llama:", llamaErr.message);
    }
  }

  throw new Error("Não foi possível conectar aos provedores de inteligência artificial.");
}

/**
 * Filtra e Estrutura o Currículo via Claude
 * Transforma texto cru em evidências limpas e ricas por categoria
 */
export async function structureResumeWithClaude(
  rawResumeText: string
): Promise<StructuredCvResult> {
  const systemPrompt = `Você é o auditor de dados curriculares da plataforma SmartVitae.
Sua missão: Transformar o currículo em uma lista LIMPA, CONCISA e ESTRUTURADA de fatos comprovados, eliminando ruídos e frases soltas.

REGRAS ESTITAS:
1. Elimine ruídos, linhas de cabeçalho vazias ou fragmentos desconexos.
2. Agrupe as qualificações em itens consistentes.
3. Classifique cada item em uma destas categorias oficiais:
   - "formacao": Graduação, Residência Médica formal CNRM, Pós-graduação, Mestrado.
   - "experiencia": Cargos de trabalho, hospitais/empresas, período e realizações.
   - "idiomas": Idiomas e nível de fluência.
   - "habilidades": Habilidades técnicas, clínicas, ferramentas e metodologias.
   - "certificacoes": CRM com UF, RQE, licenças e certificações médicas/técnicas.
   - "cursos": Cursos livres, treinamentos e badges.
   - "projetos": Projetos aplicados de tecnologia, inovação ou consultoria.
   - "publicacoes": Produção científica e publicações.

Retorne EXCLUSIVAMENTE um JSON:
{
  "candidateName": "Nome completo",
  "crmNumber": "Apenas dígitos do CRM ou null",
  "crmState": "UF do CRM ou null",
  "rqeNumbers": ["Dígitos do RQE"],
  "evidences": [
    {
      "category": "formacao" | "experiencia" | "idiomas" | "habilidades" | "certificacoes" | "cursos" | "projetos" | "publicacoes",
      "title": "Título claro da qualificação ou cargo",
      "organization": "Instituição / Emissor (ou null)",
      "period": "Período ou ano (ou null)",
      "description": "Detalhamento factual do que foi realizado",
      "sourceExcerpt": "Trecho exato do currículo original"
    }
  ]
}`;

  const userPrompt = `Filtre e estruture o seguinte currículo:\n\n${rawResumeText.substring(0, 8000)}`;

  const responseText = await callClaude(systemPrompt, userPrompt, {
    maxTokens: 1500,
    temperature: 0.1,
    json: true,
  });

  const parsed = extractJsonFromText(responseText);

  const categoryToResumeSection: Record<string, { section: ResumeSection; type: EvidenceType }> = {
    formacao: { section: "formacao", type: "graduacao" },
    experiencia: { section: "experiencia", type: "experiencia" },
    idiomas: { section: "idiomas", type: "idioma" },
    habilidades: { section: "experiencia", type: "experiencia" },
    certificacoes: { section: "certificacoes", type: "certificacao_profissional" },
    cursos: { section: "cursos", type: "curso_livre" },
    projetos: { section: "projetos", type: "projeto" },
    publicacoes: { section: "pesquisa_publicacoes", type: "publicacao" },
  };

  const evidences: EvidenceItem[] = (parsed.evidences || []).map((ev: any) => {
    const cat = (ev.category || "experiencia").toLowerCase();
    const mapping = categoryToResumeSection[cat] || {
      section: "experiencia",
      type: "experiencia",
    };

    return {
      id: crypto.randomUUID(),
      user_id: DEMO_USER_ID,
      evidence_type: mapping.type,
      resume_section: mapping.section,
      title: ev.title || "Qualificação Declarada",
      issuer_or_organization: ev.organization || null,
      description: ev.description || "",
      source_excerpt: ev.sourceExcerpt || ev.description || "",
      confidence: 0.95,
      classification_source: "jev",
      career_signal: mapping.section === "formacao" ? 5 : 4,
      review_status: "approved",
      user_locked: false,
      start_date: ev.period || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as EvidenceItem;
  });

  return {
    candidateName: parsed.candidateName || "Candidato",
    crmNumber: parsed.crmNumber || null,
    crmState: parsed.crmState ? parsed.crmState.toUpperCase() : null,
    rqeNumbers: Array.isArray(parsed.rqeNumbers) ? parsed.rqeNumbers : [],
    evidences,
  };
}

/**
 * Reestrutura o Currículo via Claude
 */
export async function generateTailoredResumeWithClaude(params: {
  jobTitle: string;
  jobText: string;
  evidences: EvidenceItem[];
  candidateName: string;
  crmInfo?: string | null;
  declaredGaps?: string[];
  targetLang?: "auto" | "pt" | "en";
}): Promise<string> {
  const { jobTitle, jobText, evidences, candidateName, crmInfo, declaredGaps, targetLang } = params;

  // 1. Detecção Inteligente de Idioma Alvo
  const combinedJob = `${jobTitle} ${jobText}`.toLowerCase();
  const englishSignals = [
    "experience",
    "requirements",
    "responsibilities",
    "qualifications",
    "bachelor",
    "degree",
    "skills",
    "remote",
    "hybrid",
    "evaluator",
    "reviewer",
    "physician",
    "doctor",
    "full-time",
    "part-time",
    "contract",
    "clinical",
    "medical domain",
    "prompt",
    "rlhf",
    "deliverables",
  ];
  const englishHits = englishSignals.filter((w) => combinedJob.includes(w)).length;
  const isEnglish =
    targetLang === "en" || (targetLang !== "pt" && englishHits >= 2);

  // 2. Prompts Especializados em conformidade com o Checklist Médicos Híbridos
  const systemPrompt = isEnglish
    ? `You are an expert executive resume writer specializing in healthcare AI and international US Resume standards (Harvard Mignone Center & Formação Médicos Híbridos standards).

YOUR CORE MISSION:
Write an impeccable, high-converting 1-column ATS-compliant US Resume strictly adhering to the "Formação Médicos Híbridos US Resume Checklist".

CHECKLIST AND ARCHITECTURAL STANDARDS (US RESUME):
1. HEADER:
   - Candidate Full Name in bold / clean uppercase.
   - Contact line: City, Country | Phone with country code (+55 ...) | Professional email | LinkedIn URL | Portfolio URL (if available).
   - OMIT photos, age, date of birth, marital status, and Brazilian identity numbers (CPF/RG).
2. SUMMARY:
   - Exactly 2 to 3 concise sentences.
   - Clinical identity with verified years of experience in relevant clinical setting.
   - Separates clinical experience years from AI evaluation / technology experience (e.g., "Physician with 5+ years of verified clinical experience, complemented by portfolio work in clinical AI evaluation").
   - Connects demonstrable skills to the target role and 2 key responsibilities from the job posting.
3. RELEVANT AI PROJECTS (Place here before or alongside experience if candidate has AI/tech projects):
   - Project name | Independent project / Course project / Volunteer role | Mon YYYY - Mon YYYY / Year.
   - Bullets start with powerful action verbs (Developed, Evaluated, Designed, Benchmarked).
   - State task, method, deliverable and scope.
   - Explicitly note honest limitations (e.g., "Self-directed project using synthetic clinical cases; does not establish suitability for patient care").
4. WORK EXPERIENCE:
   - Organization | City, Country.
   - Accurate job title in English | Mon YYYY - Mon YYYY / Present (from newest to oldest).
   - 2 to 4 bullet points per role, each beginning with a strong action verb (Conducted, Evaluated, Coordinated, Assessed, Treated, Managed).
   - Connect deliverable and scope to clinical or operational method. No "I" or "we". Past tense for completed roles, present for current.
5. EDUCATION:
   - Medical Residency (if completed formal residency): Institution | Country | Medical Residency in [Specialty] | YYYY - YYYY.
   - Medical Degree: University | Country | Medical Degree (Brazil) | YYYY - YYYY. (Do not claim unverified foreign equivalence).
6. TRAINING AND SKILLS:
   - Training: Relevant courses, issuers and dates (Mark "In progress" if ongoing).
   - Skills: Only verifiable methods and tools (e.g. Clinical reasoning, AI evaluation, Rubric design, Annotation guidelines, Medical fact verification).
   - Languages: Portuguese (Native); English (Professional working proficiency / verified level).
7. COMPLIANCE & ZERO FABRICATION:
   - NEVER invent hospital names, metrics, error reduction percentages, or unverified degrees.
   - Strictly honor declared gaps (do NOT state the candidate possesses skills they marked as lacking).
   - Remove all template notes, brackets, or placeholder text in final output.`
    : `Você é um consultor sênior executivo de carreiras médicas e transição em saúde e tecnologia (padrão Formação Médicos Híbridos / CFM).

SUA MISSÃO:
Escrever um currículo moderno, impecável, em formato ATS de 1 coluna, altamente atrativo para a vaga pretendida, seguindo o Checklist da Formação Médicos Híbridos.

PADRÕES DO CHECKLIST DE CURRÍCULO (PADRÃO MÉDICOS HÍBRIDOS):
1. CABEÇALHO:
   - Nome completo em destaque.
   - Linha de contato: Cidade, Estado / Brasil | Telefone com DDD | E-mail profissional | LinkedIn: URL | CRM: [Número-UF].
   - Sem foto, sem idade, sem estado civil, sem CPF/RG.
2. RESUMO PROFISSIONAL:
   - 2 a 3 frases concisas.
   - Identidade clínica atual com tempo comprovado de atuação clínica.
   - Separar tempo de clínica de tempo de atuação com IA/tecnologia.
   - Conectar as competências demonstradas às principais responsabilidades da vaga.
3. PROJETOS RELEVANTES EM IA E SAÚDE (Se o candidato possuir iniciativas ou projetos de portfólio):
   - Nome do Projeto | Projeto independente / acadêmico / voluntário | Período / Ano.
   - Bullets iniciados com verbos de ação (Desenvolveu, Avaliou, Elaborou, Estruturou).
   - Tarefa, escopo, método e entrega concreta. Destacar limites factuais (ex: casos sintéticos, sem validação em pacientes reais).
4. EXPERIÊNCIA PROFISSIONAL:
   - Instituição / Hospital | Cidade, UF.
   - Cargo real e período (do mais recente para o mais antigo).
   - 2 a 4 bullets por cargo iniciando com verbos de ação (Coordenou, Realizou, Avaliou, Prescreveu, Manejou).
   - Escopo, método clínico e entrega concreta. Sem "eu" ou "nós".
5. FORMAÇÃO ACADÊMICA E RESIDÊNCIA:
   - Residência Médica formal CNRM (se houver): Instituição | UF | Residência Médica em [Especialidade] | AAAA - AAAA.
   - Graduação: Universidade | UF | Graduação em Medicina | AAAA - AAAA.
6. CURSOS E COMPETÊNCIAS:
   - Treinamentos: Cursos relevantes, emissor e ano (indicar "Em andamento" se não concluído).
   - Competências: Raciocínio clínico, avaliação de respostas de IA, revisão de evidências, diretrizes de anotação.
   - Idiomas: Português (Nativo); Inglês (nível real comprovado).
7. CONFORMIDADE ÉTICA & CFM:
   - Zero alucinação: não inventar números fabricados, hospitais ou especialidades sem RQE.
   - Respeitar estritamente as lacunas que o candidato marcou como ausentes.`;

  const evidencesText = evidences
    .slice(0, 35)
    .map(
      (ev) =>
        `- [${(ev.resume_section || "experiencia").toUpperCase()}] ${ev.title} ${
          ev.issuer_or_organization ? `(${ev.issuer_or_organization})` : ""
        }: ${ev.description}`
    )
    .join("\n");

  const gapsText =
    declaredGaps && declaredGaps.length > 0
      ? `\n${
          isEnglish
            ? "REQUIREMENTS THE CANDIDATE DECLARED THEY DO NOT POSSESS (DO NOT INVENT OR SIMULATE):"
            : "REQUISITOS DA VAGA QUE O CANDIDATO DECLAROU NÃO POSSUIR (NÃO INVENTAR NEM SIMULAR):"
        }\n${declaredGaps.map((g) => `- ${g}`).join("\n")}`
      : "";

  const userPrompt = `${isEnglish ? "CANDIDATE PROFILE:" : "DADOS DO CANDIDATO:"}
Name: ${candidateName}
Registration / CRM: ${crmInfo || (isEnglish ? "Licensed physician in Brazil" : "Médico no Brasil")}

${isEnglish ? "TARGET JOB:" : "VAGA PRETENDIDA:"}
Title: ${jobTitle}
Description / Requirements:
${(jobText || "Not provided in full details").substring(0, 2500)}
${gapsText}

${isEnglish ? "AUDITED DOCUMENTARY EVIDENCE BASE:" : "BASE DE EVIDÊNCIAS AUDITADAS:"}
${evidencesText}

${
  isEnglish
    ? "Generate the complete tailored US Resume in English according to the Formação Médicos Híbridos checklist. Use clean 1-column format, selectable text, action verbs on every bullet, and no placeholder brackets."
    : "Gere o currículo completo e adaptado em Português conforme o checklist da Formação Médicos Híbridos. Use formato limpo de 1 coluna, texto selecionável, verbos de ação em todos os bullets e sem colchetes de exemplo."
}`;

  return await callClaude(systemPrompt, userPrompt, {
    maxTokens: 1200,
    temperature: 0.15,
    useSonnet: false,
  });
}

export interface CandidateFitAudit {
  matchedSkills: string[];
  missingGaps: string[];
  detailedDiagnosis: string;
  roadmap: string[];
  scores: {
    profession_fit: number; // 0 a 4
    mandatory_skills: number; // 0 a 4
    daily_activities: number; // 0 a 4
    fabrication_risk: number; // 0 a 4
    industry_fit: number; // 0 a 4
    experience_depth: number; // 0 a 4
  };
  verdict: "ship" | "fix" | "kill";
}

/**
 * Auditoria profunda de compatibilidade e lacunas com Claude
 * Lista exatamente QUAIS requisitos foram atendidos e QUAIS faltam
 */
export async function auditCandidateFitWithClaude(
  candidateProfile: string,
  targetJob: string
): Promise<CandidateFitAudit> {
  const systemPrompt = `Você é o auditor sênior de compatibilidade profissional da plataforma SmartVitae.
Sua missão: Cruzar rigorosamente o perfil do candidato com a vaga pretendida (independente de estar em português ou inglês) e gerar uma auditoria profunda, honesta e sem alucinações.

REGRAS:
1. Analise equivalências técnicas e profissionais (ex: "Degree in Medicine" e "Médico Clínico Geral com CRM" são equivalentes diretos).
2. "matchedSkills": Liste os requisitos e competências da vaga COMPROVADOS no currículo (com detalhes concretos).
3. "missingGaps": Liste com nome e sobrenome os requisitos e competências da vaga AUSENTES ou com lacuna no currículo (especifique com precisão QUAI são as competências, ferramentas ou experiências que faltam).
4. "detailedDiagnosis": Diagnóstico aprofundado e sincero explicando o alinhamento real entre o histórico e as exigências da oportunidade.
5. "roadmap": Passos práticos, realistas e específicos para essa vaga.
6. Atribua notas realistas de 0 a 4 nas 6 dimensões.
7. Veredito final estrito:
   - "kill": Perfil totalmente discrepante (ex: Médico para Vendedor de Automóveis, Engenheiro Civil para Cirurgião).
   - "fix": Perfil na mesma área ou adjacente, mas com lacunas específicas que precisam ser justificadas ou supridas.
   - "ship": Forte alinhamento nas qualificações centrais da vaga.
8. REGRA REGULATÓRIA MANDATÓRIA (LEI DO ATO MÉDICO / CONSELHOS DE CLASSE):
   - Odontologia / Cirurgião-Dentista / Bucomaxilo (CRO) NUNCA é Medicina (CRM).
   - Enfermagem (COREN), Farmácia (CRF), Fisioterapia (CREFITO), Biomedicina (CRBM) e Psicologia (CRP) NÃO são Medicina (CRM).
   - Se a vaga exigir formação médica (Médico, Medicina, CRM, ou especialidade médica privativa como Endocrinologia, Cardiologia, Cirurgia, etc.) e o candidato for de outra profissão da saúde (como Dentista, Bucomaxilo, Enfermeiro, Farmacêutico), o veredito DEVE SER OBRIGATORIAMENTE "kill", com nota 0.0 em profession_fit e mandatory_skills.
   - NUNCA declare requisitos médicos privativos como atendidos por profissionais não médicos!
   - Da mesma forma, se a vaga exigir Odontologia/CRO e o candidato for Médico, o veredito é "kill".

Retorne EXCLUSIVAMENTE um JSON:
{
  "matchedSkills": ["Requisito atendido 1...", "Requisito atendido 2..."],
  "missingGaps": ["Competência ou ferramenta faltante específica..."],
  "detailedDiagnosis": "Texto aprofundado do diagnóstico...",
  "roadmap": ["Passo 1...", "Passo 2..."],
  "scores": {
    "profession_fit": 0.0 a 4.0,
    "mandatory_skills": 0.0 a 4.0,
    "daily_activities": 0.0 a 4.0,
    "fabrication_risk": 0.0 a 4.0,
    "industry_fit": 0.0 a 4.0,
    "experience_depth": 0.0 a 4.0
  },
  "verdict": "ship" | "fix" | "kill"
}`;

  const userPrompt = `CURRÍCULO DO CANDIDATO:\n${candidateProfile.substring(0, 4000)}\n\nVAGA PRETENDIDA:\n${targetJob.substring(0, 4000)}`;

  const responseText = await callClaude(systemPrompt, userPrompt, {
    maxTokens: 850,
    temperature: 0.1,
    json: true,
  });

  const parsed = extractJsonFromText(responseText);

  return {
    matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [],
    missingGaps: Array.isArray(parsed.missingGaps) ? parsed.missingGaps : [],
    detailedDiagnosis: parsed.detailedDiagnosis || "Diagnóstico concluído com base nas evidências comprovadas.",
    roadmap: Array.isArray(parsed.roadmap) ? parsed.roadmap : [],
    scores: {
      profession_fit: Number(parsed.scores?.profession_fit ?? 2.5),
      mandatory_skills: Number(parsed.scores?.mandatory_skills ?? 2.5),
      daily_activities: Number(parsed.scores?.daily_activities ?? 2.0),
      fabrication_risk: Number(parsed.scores?.fabrication_risk ?? 3.0),
      industry_fit: Number(parsed.scores?.industry_fit ?? 2.5),
      experience_depth: Number(parsed.scores?.experience_depth ?? 2.5),
    },
    verdict:
      parsed.verdict === "ship"
        ? "ship"
        : parsed.verdict === "kill" || parsed.verdict === "reject"
        ? "kill"
        : "fix",
  };
}

