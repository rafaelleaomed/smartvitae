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
 * Chamada unificada ao modelo Claude via OpenRouter
 * Prioriza Claude Haiku 4.5 e Sonnet 4.5 com limites seguros de tokens para não estourar créditos
 */
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
  const openRouterKey = process.env.OPENROUTER_API_KEY || "";

  if (!openRouterKey) {
    throw new Error("Chave OPENROUTER_API_KEY não configurada no ambiente.");
  }

  // Limite seguro de tokens para caber dentro da reserva de crédito do OpenRouter
  const safeTokens = Math.min(options.maxTokens || 1500, 1600);

  // Seleção de modelos: Claude Haiku 4.5 é super rápido e consome pouquíssimos créditos
  const preferredModel = options.useSonnet
    ? "anthropic/claude-sonnet-4.5"
    : "anthropic/claude-haiku-4.5";

  const requestBody: any = {
    model: preferredModel,
    temperature: options.temperature ?? 0.1,
    max_tokens: safeTokens,
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

  // Fallback 1: Claude Haiku 4.5 (se tentou Sonnet antes)
  if (options.useSonnet) {
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
          max_tokens: safeTokens,
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

  // Fallback 2: Gemini 2.5 Flash
  try {
    console.info("Acionando fallback para Gemini 2.5 Flash...");
    const fallbackRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "SmartVitae Gemini Fallback",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: options.temperature ?? 0.2,
        max_tokens: safeTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (fallbackRes.ok) {
      const fbData = await fallbackRes.json();
      return fbData.choices?.[0]?.message?.content || "";
    }
  } catch (fbErr: any) {
    console.error("Erro no fallback Gemini:", fbErr.message);
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
}): Promise<string> {
  const { jobTitle, jobText, evidences, candidateName, crmInfo, declaredGaps } = params;

  const systemPrompt = `Você é um consultor sênior executivo de carreiras na área de saúde e tecnologia no SmartVitae.
Sua missão: Escrever um currículo impecável, moderno, em formato ATS de 1 coluna, altamente atrativo para a vaga pretendida.

REGRAS DE CONFORMIDADE ÉTICA E ZERO ALUCINAÇÃO:
1. Use ESTRITAMENTE as evidências e fatos fornecidos na base documental.
2. NUNCA invente empregadores, hospitais, cursos, anos ou certificações.
3. Se houver lacunas informadas (requisitos que o candidato declarou não possuir), NÃO as mencione como existentes. Destaque os pontos fortes reais.
4. Redija um resumo executivo poderoso conectando a experiência real às demandas da vaga.
5. Formate em texto estruturado limpo.

ESTRUTURA:
================================================================================
${candidateName.toUpperCase()}${crmInfo ? ` • ${crmInfo}` : ""}
ALVO PROFISSIONAL: ${jobTitle.toUpperCase()}
================================================================================

RESUMO PROFISSIONAL E ALINHAMENTO ESTRATÉGICO
[Resumo executivo conectando a bagagem real aos desafios da vaga]

EXPERIÊNCIA PROFISSIONAL RELEVANTE
[Cargos, instituições, períodos e realizações factuais]

FORMAÇÃO ACADÊMICA E RESIDÊNCIA MÉDICA
[Instituições, graduações, residências CNRM]

COMPETÊNCIAS TÉCNICAS, IDIOMAS & HABILIDADES
[Idiomas, ferramentas e metodologias comprovadas]

CERTIFICAÇÕES E LICENÇAS COMPROVADAS
[Registros, certificações e capacitações formais]

================================================================================
TERMO DE CONFORMIDADE ÉTICA & RESOLUÇÕES CFM:
Nenhum título de especialista (RQE) ou experiência foi fabricado para esta candidatura. Currículo estruturado com base estrita em evidências documentais auditadas.`;

  const evidencesText = evidences
    .slice(0, 30)
    .map(
      (ev) =>
        `- [${(ev.resume_section || "experiencia").toUpperCase()}] ${ev.title} ${
          ev.issuer_or_organization ? `(${ev.issuer_or_organization})` : ""
        }: ${ev.description}`
    )
    .join("\n");

  const gapsText =
    declaredGaps && declaredGaps.length > 0
      ? `\nREQUISITOS DA VAGA QUE O CANDIDATO DECLAROU NÃO POSSUIR (NÃO INVENTAR NEM SIMULAR):\n${declaredGaps.map((g) => `- ${g}`).join("\n")}`
      : "";

  const userPrompt = `DADOS DO CANDIDATO:
Nome: ${candidateName}
Registro / CRM: ${crmInfo || "Não aplicável"}

VAGA PRETENDIDA:
Cargo / Título: ${jobTitle}
Descrição dos Requisitos:
${(jobText || "Não fornecido em detalhes").substring(0, 2000)}
${gapsText}

BASE DE EVIDÊNCIAS AUDITADAS:
${evidencesText}

Gere o currículo completo, altamente polido, pronto para uso e visualmente equilibrado em texto formatado.`;

  return await callClaude(systemPrompt, userPrompt, {
    maxTokens: 1500,
    temperature: 0.2,
    useSonnet: false, // Haiku 4.5 gera rápido, bonito e sem estourar cota!
  });
}
