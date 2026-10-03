"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Loader2,
  HelpCircle,
  AlertOctagon,
  BarChart3,
  Lock,
  RotateCcw,
  Compass,
  FileText,
} from "lucide-react";
import { StressTestResult } from "@/services/decisions/stress-test";

const DEMO_DOCTOR_CV = `Dr. Rafael Leão
Médico Clínico Geral | CRM 123456-SP • RQE 65432
Experiência:
- Médico Assistente no Hospital das Clínicas da FMUSP (5 anos)
- Residência em Clínica Médica pela CNRM/FMUSP
- Cursos em Inteligência Artificial e Saúde Digital pelo Google Cloud
- Publicações científicas em periódicos indexados sobre inovação clínica`;

const DEMO_HEALTH_INNOVATION_JOB = `Vaga: Gerente Médico de Inovação e Saúde Digital
Empresa: Healthtech Brasil
Requisitos:
- Graduação em Medicina com CRM ativo no estado de SP.
- Experiência assistencial ou hospitalar comprovada.
- Conhecimentos em Inteligência Artificial, prontuário eletrônico e tecnologias de saúde.
- Desejável experiência em projetos de inovação clínica e liderança multidisciplinar.`;

const DEMO_SALES_JOB = `Vaga: Vendedor / Consultor Comercial de Veículos
Empresa: Concessionária AutoMax
Requisitos:
- Experiência comprovada em vendas presenciais de automóveis e negociação de consórcio/financiamento.
- Prospecção ativa de clientes e atingimento de metas agressivas de vendas.
- CNH categoria B e domínio de funil de vendas comercial.`;

export default function HomePage() {
  const router = useRouter();

  // Passo 1: Currículo / Perfil
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [activeDemo, setActiveDemo] = useState<"innovation" | "sales" | null>(null);

  // Passo 2: Vaga
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");

  // Estado do Processamento
  const [isProcessing, setIsProcessing] = useState(false);
  const [stressTest, setStressTest] = useState<StressTestResult | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [canAdapt, setCanAdapt] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsManualJobText, setNeedsManualJobText] = useState(false);

  const jobTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleApplyDemo = (type: "innovation" | "sales") => {
    setActiveDemo(type);
    setResumeFile(null);
    setResumeText(DEMO_DOCTOR_CV);
    setJobUrl("");
    setJobText(type === "innovation" ? DEMO_HEALTH_INNOVATION_JOB : DEMO_SALES_JOB);
    setStressTest(null);
    setErrorMessage(null);
    setNeedsManualJobText(false);
  };

  const handleReset = () => {
    setResumeFile(null);
    setResumeText("");
    setJobUrl("");
    setJobText("");
    setActiveDemo(null);
    setStressTest(null);
    setJobTitle("");
    setCanAdapt(false);
    setErrorMessage(null);
    setNeedsManualJobText(false);
  };

  const handleRunAdaptation = async () => {
    setIsProcessing(true);
    setStressTest(null);
    setErrorMessage(null);
    setNeedsManualJobText(false);

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
        if (data.needsManualJobText) {
          setNeedsManualJobText(true);
          setErrorMessage(data.error);
          setTimeout(() => {
            jobTextareaRef.current?.focus();
          }, 300);
          return;
        }
        throw new Error(data.error || "Falha na análise da vaga pelo SmartVitae.");
      }

      setStressTest(data.stressTest);
      setJobTitle(data.jobTitle || "Vaga Pretendida");
      setCanAdapt(!!data.canAdapt);

      // Armazena contexto para a página de adaptação
      if (data.canAdapt) {
        sessionStorage.setItem("smartvitae_job_title", data.jobTitle || "Vaga Pretendida");
        sessionStorage.setItem("smartvitae_job_text", data.jobText || jobText);
        sessionStorage.setItem("smartvitae_stress_test", JSON.stringify(data.stressTest));
        sessionStorage.setItem("nexovitae_job_title", data.jobTitle || "Vaga Pretendida");
        sessionStorage.setItem("nexovitae_job_text", data.jobText || jobText);
        sessionStorage.setItem("nexovitae_stress_test", JSON.stringify(data.stressTest));
      }

      // Scroll suave para o resultado do diagnóstico
      setTimeout(() => {
        const el = document.getElementById("resultado-adaptacao");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch (err: any) {
      setErrorMessage(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-16">
      {/* Cabeçalho de Autoridade e Propósito */}
      <section className="text-center space-y-4 pt-2">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Auditoria Factual de Currículo e Teste de Estresse para Vagas
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          O <strong>SmartVitae</strong> avalia a correlação factual entre seu histórico e a vaga
          através do <strong>Jev (TypeSafe AI)</strong> em 6 dimensões rigorosas.
          Zero alucinação, conformidade ética com o CFM e veredito transparente antes de qualquer adaptação.
        </p>

        {/* Cenários Rápidos de Demonstração */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Casos rápidos para testar:</span>
          <button
            type="button"
            onClick={() => handleApplyDemo("innovation")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              activeDemo === "innovation"
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            Médico → Inovação em Saúde (FIX / Parcial)
          </button>
          <button
            type="button"
            onClick={() => handleApplyDemo("sales")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              activeDemo === "sales"
                ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            Médico → Vendas Automotivas (KILL / Incompatível)
          </button>

          {(resumeText || jobText || resumeFile) && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer ml-1"
              title="Limpar campos"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
        </div>
      </section>

      {/* Alerta de Erro ou Solicitação de Texto Manual */}
      {errorMessage && (
        <div
          role="alert"
          className={`rounded-2xl p-4 text-xs flex items-start gap-3 border transition-all ${
            needsManualJobText
              ? "bg-amber-50/90 border-amber-300 text-amber-900"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {needsManualJobText ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <span className="font-bold block">
              {needsManualJobText
                ? "Leitura Automática Bloqueada pelo Site da Vaga"
                : "Atenção ao Processar"}
            </span>
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Grid Principal: 2 Passos com Proximidade e Ritmo Deliberado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* ========================================================================= */}
        {/* PASSO 1: Histórico Profissional                                          */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                1
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Evidências Factuais
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Seu Currículo ou Histórico
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Envie o PDF do seu currículo ou cole o texto do seu perfil profissional.
              </p>
            </div>

            {/* Dropzone de Arquivo */}
            <label className="border-2 border-dashed border-slate-200 hover:border-blue-500 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 rounded-xl p-5 text-center cursor-pointer block transition-colors bg-slate-50/60 hover:bg-blue-50/20">
              <UploadCloud className="w-7 h-7 text-blue-600 mx-auto mb-2" />
              <span className="text-xs font-semibold text-slate-800 block">
                {resumeFile ? resumeFile.name : "Clique para selecionar o PDF / DOCX"}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Aceita currículo tradicional ou "Salvar como PDF" do LinkedIn
              </span>
              <input
                type="file"
                accept=".pdf,.docx"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setResumeFile(f);
                    setResumeText("");
                    setActiveDemo(null);
                  }
                }}
              />
            </label>

            {/* Colar Texto */}
            <div className="space-y-1.5">
              <label htmlFor="resume-text" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Ou cole o texto do seu perfil / Lattes:
              </label>
              <textarea
                id="resume-text"
                rows={5}
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                  setResumeFile(null);
                  setActiveDemo(null);
                }}
                placeholder="Ex: Dr. Silva, Residência no HC, cursos em IA, artigos publicados..."
                className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed font-sans"
              />
            </div>

            {/* Acesso à Base do Zero */}
            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/documentos"
                className="w-full group flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200 transition-colors text-left"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    Não possui currículo pronto?
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Construa sua base do zero com certificados avulsos, link do LinkedIn ou Lattes.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </Link>
            </div>
          </div>

          {(resumeFile || resumeText.length > 20) && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Currículo pronto para auditoria pelo Jev.</span>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* PASSO 2: A Vaga Pretendida                                               */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                2
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Gupy, LinkedIn ou Hospital
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                A Vaga Pretendida
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Insira o link da vaga ou cole a descrição completa dos requisitos.
              </p>
            </div>

            {/* Link da Vaga */}
            <div className="space-y-1.5">
              <label htmlFor="job-url" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Link da Vaga (URL):
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="job-url"
                  type="url"
                  value={jobUrl}
                  onChange={(e) => {
                    let val = e.target.value;
                    const match = val.match(/[?&]currentJobId=([0-9]{6,12})/i);
                    if (match && match[1]) {
                      val = `https://www.linkedin.com/jobs/view/${match[1]}/`;
                    }
                    setJobUrl(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="https://vagas.gupy.io/job/... ou linkedin.com/jobs/..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans"
                />
              </div>
            </div>

            {/* Descrição da Vaga */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="job-text" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Ou cole o texto / requisitos da vaga:
                </label>
                {needsManualJobText && (
                  <span className="text-[11px] font-bold text-amber-700 animate-pulse">
                    Cole o texto aqui ↓
                  </span>
                )}
              </div>
              <textarea
                id="job-text"
                ref={jobTextareaRef}
                rows={5}
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                placeholder="Cole o anúncio da vaga com os requisitos obrigatórios, responsabilidades e diferenciais..."
                className={`w-full p-3 text-xs border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 leading-relaxed transition-all font-sans ${
                  needsManualJobText
                    ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20"
                    : "border-slate-200 focus:ring-blue-500/20"
                }`}
              />
            </div>
          </div>

          {(jobUrl.length > 10 || jobText.length > 20) && (
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
              <span>Vaga configurada para extração de requisitos.</span>
            </div>
          )}
        </div>
      </div>

      {/* Botão de Ação Central */}
      <div className="text-center space-y-2 pt-2">
        <button
          type="button"
          onClick={handleRunAdaptation}
          disabled={isProcessing || (!resumeFile && resumeText.trim().length < 15)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-4 rounded-xl shadow-md text-sm sm:text-base transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submetendo ao Teste de Estresse do JEV...
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              Analisar Aderência com Jev
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
        <p className="text-xs text-slate-500">
          Travas CFM & Anti-Alucinação: se o perfil for incompatível, a adaptação mentirosa é bloqueada.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO DE RESULTADOS: DIAGNÓSTICO JEV                                     */}
      {/* ========================================================================= */}
      {stressTest && (
        <section id="resultado-adaptacao" aria-labelledby="stress-test-title" className="space-y-8 pt-8 border-t border-slate-200">
          {/* Card do Veredito Geral */}
          <div
            className={`rounded-2xl border p-6 sm:p-8 shadow-xs transition-all ${
              stressTest.verdict === "kill"
                ? "bg-rose-50/50 border-rose-200"
                : stressTest.verdict === "fix"
                ? "bg-amber-50/50 border-amber-200"
                : "bg-emerald-50/50 border-emerald-200"
            }`}
          >
            {/* Topo do Veredito */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200/80 pb-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  {stressTest.verdict === "kill" && (
                    <span className="bg-rose-600 text-white px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-xs">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      Veredito: KILL
                    </span>
                  )}
                  {stressTest.verdict === "fix" && (
                    <span className="bg-amber-600 text-white px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-xs">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Veredito: FIX
                    </span>
                  )}
                  {stressTest.verdict === "ship" && (
                    <span className="bg-emerald-600 text-white px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Veredito: SHIP
                    </span>
                  )}
                  <span className="text-slate-700 font-bold">
                    {stressTest.verdictLabel}
                  </span>
                </div>

                <h3 id="stress-test-title" className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stressTest.verdict === "kill" && "Candidatura Não Recomendada (Desalinhada)"}
                  {stressTest.verdict === "fix" && "Candidatura Parcial (Requer Ajuste de Lacunas)"}
                  {stressTest.verdict === "ship" && "Candidatura Altamente Aderente (Aprovada para Envio)"}
                </h3>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-2xl">
                  {stressTest.verdictDescription}
                </p>
              </div>

              {/* Score / Gauge */}
              <div className="flex items-center justify-between sm:justify-start gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs w-full sm:w-auto shrink-0">
                <div className="text-left sm:text-right">
                  <div
                    className={`text-3xl sm:text-4xl font-black tabular-nums ${
                      stressTest.verdict === "kill"
                        ? "text-rose-600"
                        : stressTest.verdict === "fix"
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {stressTest.score}%
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Aderência Real
                  </div>
                </div>
                <div className="border-l border-slate-200 pl-3 text-[10px] text-slate-600 space-y-0.5 text-right sm:text-left tabular-nums">
                  <div><strong>Motor:</strong> Jev System One</div>
                  <div><strong>Modelo:</strong> {stressTest.model}</div>
                  <div><strong>Latência:</strong> {stressTest.latencyMs}ms</div>
                </div>
              </div>
            </div>

            {/* Diagnóstico Implacável */}
            <div className="pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Diagnóstico Implacável (Sem Alucinação e Sem Falsas Esperanças):
                </h4>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                "{stressTest.honestDiagnosis}"
              </div>
            </div>

            {/* Matriz das 6 Dimensões do JEV */}
            <div className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-700" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Avaliação Multidimensional pelo Jev:
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Notas de 0 a 4 (Escala TypeSafe)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stressTest.dimensions.map((dim) => {
                  const isLow = dim.score < 35;
                  const isMedium = dim.score >= 35 && dim.score < 65;
                  return (
                    <div
                      key={dim.key}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {dim.label}
                          </span>
                          <span
                            className={`text-xs font-black tabular-nums ${
                              isLow
                                ? "text-rose-600"
                                : isMedium
                                ? "text-amber-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {dim.rawScore.toFixed(1)}/4
                          </span>
                        </div>

                        {/* Barra de Progresso */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLow
                                ? "bg-rose-500"
                                : isMedium
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.max(dim.score, 5)}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-tight">
                        {dim.assessment}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Requisitos Comprovados no Currículo */}
            {stressTest.matchedSkills && stressTest.matchedSkills.length > 0 && (
              <div className="pt-6 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Requisitos e Competências Comprovados no seu Histórico:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {stressTest.matchedSkills.map((skill, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white border border-emerald-200 text-xs text-slate-800 flex items-start gap-2 shadow-xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                      <span className="font-medium">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lacunas Críticas (Gaps Específicos) */}
            {stressTest.criticalGaps.length > 0 && (
              <div className="pt-6 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Lacunas Específicas da Vaga a Serem Supridas:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {stressTest.criticalGaps.map((gap, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white border border-amber-200 text-xs text-slate-800 flex items-start gap-2 shadow-xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span>{gap}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Roadmap para Atingir a Vaga */}
            {stressTest.roadmapToTarget.length > 0 && (
              <div className="pt-6 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-600" />
                  Roadmap Realista para Atingir a Vaga:
                </h4>
                <div className="space-y-2">
                  {stressTest.roadmapToTarget.map((step, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 flex items-start gap-2.5 shadow-xs"
                    >
                      <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* AÇÃO PÓS-VEREDITO: BLOQUEIO ÉTICO OU LIBERAÇÃO PARA ADAPTAÇÃO             */}
          {/* ========================================================================= */}
          {!canAdapt || stressTest.verdict === "kill" ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 text-white p-6 sm:p-8 text-center space-y-4 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-amber-400">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-2 max-w-xl mx-auto">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                  Adaptação de Currículo Bloqueada pelo SmartVitae
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Para proteger sua credibilidade perante recrutadores e respeitar as normas éticas
                  profissionais (Resolução CFM nº 2.336/2023), o <strong>SmartVitae recusa-se a fabricar
                  experiências fictícias</strong> para vagas estruturalmente incompatíveis.
                </p>
                <p className="text-xs text-slate-400">
                  Diferente de geradores que inventam qualificações, nós defendemos sua reputação com a verdade.
                  Utilize o roadmap acima para desenvolver essas competências ou submeta uma vaga condizente com seu histórico.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
              <div className="space-y-2 text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Candidatura Viável Factualmente
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Pronto para adaptar seu currículo sem invenções?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  Acesse o estúdio de adaptação para cruzar os dados do JEV, sanar lacunas identificadas
                  com certificados reais e reestruturar seu currículo ATS com base estritamente factual.
                </p>
              </div>

              <Link
                href="/adaptar"
                className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all transform hover:-translate-y-0.5 shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                Adaptar Currículo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
