"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Copy,
  Download,
  Linkedin,
  ArrowRight,
  Loader2,
  FileCheck2,
  Check,
  ExternalLink,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import { TailoredResumeResult } from "@/services/generation/tailor-service";

export default function HomePage() {
  // Passo 1: Currículo / Perfil
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [useDemoProfile, setUseDemoProfile] = useState(false);

  // Passo 2: Vaga
  const [jobUrl, setJobUrl] = useState("https://vagas.gupy.io/job/12345-medico-inovacao-saude");
  const [jobText, setJobText] = useState("");

  // Estado do Processamento
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TailoredResumeResult | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Injetar Perfil de Exemplo (Dr. Rafael Leão / Comunidade Médicos Híbridos)
  const handleLoadDemo = () => {
    setResumeFile(null);
    setUseDemoProfile(true);
    setResumeText(`Dr. Rafael Leão
Médico | Inovação em Saúde & Tecnologias Clínicas
CRM 123456-SP • RQE 65432

Experiência
Médico Assistente e Pesquisador Clínico
Hospital das Clínicas da FMUSP
2021 - Presente
- Atuação em protocolos clínicos, saúde digital e incorporação de IA em rotinas hospitalares.

Residência Médica em Clínica Médica (CNRM)
Hospital das Clínicas da FMUSP
2019 - 2021
- Rotações em UTI, emergência e gestão de fluxos de pacientes complexos.

Formação acadêmica
Faculdade de Medicina da USP
Graduação em Medicina
2013 - 2018

Licenças e Certificações
Generative AI for Healthcare Professional Badge
Google Cloud & DeepLearning.AI
- Avaliação de segurança e LLMs clínicas.

Suporte Avançado de Vida Cardiovascular (ACLS)
American Heart Association`);

    setJobUrl("https://healthtech.gupy.io/job/gerente-medico-inovacao");
    setJobText(`Vaga: Gerente Médico de Inovação e Saúde Digital
Empresa: Healthtech Brasil
Local: São Paulo, SP (Híbrido)

Responsabilidades:
- Liderar a avaliação clínica de modelos de Inteligência Artificial e prontuários eletrônicos.
- Atuar como ponte técnica entre médicos assistentes, cientistas de dados e time de produto.
- Garantir a conformidade ética e regulatória (CFM/LGPD) em todas as soluções clínicas.

Requisitos Obrigatórios:
- Graduação completa em Medicina com registro ativo (CRM).
- Residência médica reconhecida ou experiência assistencial sólida.
- Conhecimento demonstrável em inteligência artificial generativa aplicada à saúde.
- Habilidade comprovada em liderança de projetos e visão de produto.

Diferenciais:
- Certificações em Cloud ou AI em Saúde.
- Experiência prévia em hospitais de ponta ou startups.`);
  };

  const handleRunAdaptation = async () => {
    setIsProcessing(true);
    setResult(null);

    try {
      const formData = new FormData();
      if (resumeFile) {
        formData.append("resumeFile", resumeFile);
      }
      formData.append("resumeText", resumeText);
      formData.append("jobUrl", jobUrl);
      formData.append("jobText", jobText);

      const res = await fetch("/api/adapt", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha na adaptação do currículo.");
      }

      setResult(data.result);

      // Scroll suave para o resultado
      setTimeout(() => {
        const el = document.getElementById("resultado-adaptacao");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-16">
      {/* Cabeçalho Focado no Fluxo Direto */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          NexoVitae • Inteligência Curricular sem Alucinação
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Jogue seu currículo. Jogue a vaga.
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          O <strong>NexoVitae</strong> utiliza o motor de decisão do <strong>Jev (TypeSafe AI / System One)</strong> para extrair suas evidências, 
          cruzar com os requisitos da vaga e adaptar seu currículo com travas éticas do <strong>CFM & RQE</strong>.
        </p>
      </div>

      {/* Grid Principal: Passo 1 --> Passo 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* PASSO 1: O Currículo */}
        <div className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-blue-500/80 transition-all p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                1
              </span>
              <button
                type="button"
                onClick={handleLoadDemo}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60"
              >
                Preencher Demonstração
              </button>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Jogue aqui seu Currículo ou Perfil
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Suba o PDF do seu currículo, o PDF do LinkedIn ou cole o texto.
              </p>
            </div>

            {/* Dropzone de Arquivo */}
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-5 text-center cursor-pointer block transition-colors bg-slate-50/50 hover:bg-blue-50/20">
              <UploadCloud className="w-7 h-7 text-blue-600 mx-auto mb-2" />
              <span className="text-xs font-semibold text-slate-700 block">
                {resumeFile ? resumeFile.name : "Clique para selecionar o PDF / DOCX"}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Aceita currículo tradicional ou "Salvar como PDF" do LinkedIn
              </span>
              <input
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setResumeFile(f);
                    setResumeText("");
                    setUseDemoProfile(false);
                  }
                }}
              />
            </label>

            {/* Ou Colar Texto */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Ou cole o texto do seu perfil / Lattes:
              </label>
              <textarea
                rows={4}
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                  setResumeFile(null);
                  setUseDemoProfile(false);
                }}
                placeholder="Ex: Dr. Silva, Residência no HC, cursos em IA..."
                className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Botão Solicitado: Não possuo currículo */}
            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/documentos"
                className="w-full group flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 hover:from-blue-50 hover:to-indigo-50/60 border border-slate-200/80 hover:border-blue-300 transition-all text-left shadow-sm"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    Não possuo currículo pronto?
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Construa sua base do zero com certificados avulsos, link do LinkedIn ou Lattes.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </Link>
            </div>
          </div>

          {(resumeFile || resumeText.length > 20 || useDemoProfile) && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Currículo pronto para processamento auditável.</span>
            </div>
          )}
        </div>

        {/* PASSO 2: A Vaga */}
        <div className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-blue-500/80 transition-all p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                2
              </span>
              <span className="text-xs font-medium text-slate-400">Gupy, LinkedIn ou Hospital</span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Jogue aqui a Vaga Pretendida
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Insira o link da vaga ou cole a descrição das responsabilidades.
              </p>
            </div>

            {/* Link da Vaga */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Link da Vaga (URL):
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://gupy.io/vaga/... ou linkedin.com/jobs/..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Descrição da Vaga */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Ou cole o texto / requisitos da vaga:
              </label>
              <textarea
                rows={4}
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                placeholder="Cole o anúncio da vaga com os requisitos obrigatórios e diferenciais..."
                className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {(jobUrl.length > 10 || jobText.length > 20) && (
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Vaga configurada para extração de requisitos.</span>
            </div>
          )}
        </div>
      </div>

      {/* Botão de Ação Central */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={handleRunAdaptation}
          disabled={isProcessing || (!resumeFile && resumeText.trim().length < 15)}
          className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-blue-600/30 text-base transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analisando com o Jev e Cruzando Evidências...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Analisar Aderência e Adaptar Currículo
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
        <p className="text-xs text-slate-400 mt-2">
          Travas CFM ativas: títulos de especialista só são utilizados com RQE comprovado.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO DE RESULTADOS IMEDIATOS                                             */}
      {/* ========================================================================= */}
      {result && (
        <div id="resultado-adaptacao" className="space-y-8 pt-6 border-t border-slate-200">
          {/* 1. Diagnóstico de Aderência e Matriz Requisito x Evidência */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">
                    Diagnóstico de Aderência Factual
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Jev Matching
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vaga Alvo: <strong>{result.targetRole}</strong>
                </p>
              </div>

              {/* Score de Aderência */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-blue-600">
                    {result.adherenceScore}%
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">Aderência Real</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
                  {result.matchingDetails.metRequirements}/{result.matchingDetails.totalRequirements}
                </div>
              </div>
            </div>

            {/* Aviso CFM e Ético */}
            <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed">
                <strong>{result.matchingDetails.cfmNotice}</strong>
                <br />
                O sistema selecionou apenas as competências comprovadas por certificados e não inventou 
                certificações inexistentes para inflar a pontuação de ATS.
              </div>
            </div>

            {/* Lista de Lacunas Honestas (Sem Alucinação) */}
            {result.matchingDetails.gaps.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Lacunas Identificadas na Vaga (Informações que sua base ainda não comprova):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.matchingDetails.gaps.map((gap, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{gap}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. O Currículo Adaptado ATS-Friendly */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Currículo Adaptado (Compatível com ATS / 1 Coluna)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `${result.candidateName} - ${result.crmInfo || ""}\n${result.targetRole}\n\nRESUMO:\n${result.summary}\n\n` +
                      result.sections.map((s) => `${s.title.toUpperCase()}\n` + s.items.map((i) => `• ${i.title} (${i.subtitle || ""}, ${i.period || ""}): ${i.details}`).join("\n")).join("\n\n");
                    handleCopy(text, "resume");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-sm transition-colors"
                >
                  {copiedSection === "resume" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar Currículo
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Imprimir / Salvar PDF
                </button>
              </div>
            </div>

            {/* Folha do Currículo Renderizada */}
            <div className="p-8 sm:p-12 max-w-3xl mx-auto space-y-6 text-slate-800 font-sans">
              {/* Cabeçalho do Currículo */}
              <div className="border-b border-slate-200 pb-4 text-center space-y-1">
                <h2 className="text-2xl font-bold text-slate-900">{result.candidateName}</h2>
                <div className="text-xs text-slate-600 font-medium">
                  {result.crmInfo && <span>{result.crmInfo} • </span>}
                  <span className="text-blue-700 font-semibold">{result.targetRole}</span>
                </div>
              </div>

              {/* Resumo Profissional */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                  Resumo Profissional
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed text-justify">
                  {result.summary}
                </p>
              </div>

              {/* Seções Estruturadas com Grounding Auditável */}
              {result.sections.map((sec, idx) => (
                <div key={idx} className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                    {sec.title}
                  </h4>
                  <div className="space-y-3">
                    {sec.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="space-y-1">
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="font-bold text-slate-900">{item.title}</span>
                          <span className="text-slate-500 text-[11px]">{item.period}</span>
                        </div>
                        {item.subtitle && (
                          <div className="text-[11px] font-semibold text-slate-600">
                            {item.subtitle}
                          </div>
                        )}
                        <p className="text-xs text-slate-600 leading-relaxed">{item.details}</p>
                        {item.evidenceSource && (
                          <div className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/50">
                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                            Fonte comprovada: {item.evidenceSource}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Kit LinkedIn Complementar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Linkedin className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">
                Kit LinkedIn para esta Oportunidade
              </h3>
            </div>

            <div className="space-y-4">
              {/* Headlines Sugeridas */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Sugestões de Título (Headline):
                </span>
                <div className="space-y-2">
                  {result.linkedInKit.headlines.map((hl, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="font-medium text-slate-800">{hl}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(hl, `hl-${i}`)}
                        className="text-blue-600 hover:text-blue-800 font-semibold shrink-0"
                      >
                        {copiedSection === `hl-${i}` ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção Sobre */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Seção "Sobre" em 1ª Pessoa:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.linkedInKit.aboutSection, "about")}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    {copiedSection === "about" ? "Copiado!" : "Copiar Texto"}
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  {result.linkedInKit.aboutSection}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
