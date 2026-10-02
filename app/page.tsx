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
} from "lucide-react";
import { StressTestResult } from "@/services/decisions/stress-test";

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
        // Manter fallback por compatibilidade
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
    <div className="space-y-10 max-w-5xl mx-auto pb-16">
      {/* Cabeçalho Focado no Fluxo Direto */}
      <div className="text-center space-y-3 pt-2 px-1">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-sm max-w-full">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">SmartVitae • Motor de Decisão Jev (System One)</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight break-words">
          Jogue seu currículo. Jogue a vaga.
        </h1>
        <p className="text-slate-600 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed">
          O <strong>SmartVitae</strong> avalia a correlação factual entre seu histórico e a vaga
          através do <strong>Jev (TypeSafe AI)</strong> em 6 dimensões rigorosas.
          Zero alucinação, zero falsas esperanças: se não der match, você recebe um veredito transparente.
        </p>

        {/* Banners de Teste Rápido */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          

          

          {(resumeText || jobText || resumeFile) && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Alerta de Erro Geral ou Pedido de Texto Manual */}
      {errorMessage && (
        <div
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

      {/* Grid Principal: Passo 1 --> Passo 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* ========================================================================= */}
        {/* PASSO 1: O Currículo                                                     */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-blue-500/80 transition-all p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                1
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Evidências Factuais
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Jogue aqui seu Currículo ou Perfil
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Suba o PDF do seu currículo, PDF do LinkedIn ou cole o texto.
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
                    setActiveDemo(null);
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
                rows={5}
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                  setResumeFile(null);
                  setActiveDemo(null);
                }}
                placeholder="Ex: Dr. Silva, Residência no HC, cursos em IA, artigos publicados..."
                className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
              />
            </div>

            {/* Botão: Não possuo currículo pronto */}
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
                    Construa sua base factual do zero com certificados avulsos, link do LinkedIn ou Lattes.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </Link>
            </div>
          </div>

          {(resumeFile || resumeText.length > 20) && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Currículo pronto para auditoria pelo Jev.</span>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* PASSO 2: A Vaga                                                          */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-indigo-500/80 transition-all p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                2
              </span>
              <span className="text-xs font-medium text-slate-400">
                Gupy, LinkedIn ou Hospital
              </span>
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
                  placeholder="https://vagas.gupy.io/job/... ou linkedin.com/jobs/..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Descrição da Vaga */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Ou cole o texto / requisitos da vaga:
                </label>
                {needsManualJobText && (
                  <span className="text-[11px] font-bold text-amber-700 animate-pulse">
                    Cole o texto aqui ↓
                  </span>
                )}
              </div>
              <textarea
                ref={jobTextareaRef}
                rows={5}
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                placeholder="Cole o anúncio da vaga com os requisitos obrigatórios, responsabilidades e diferenciais..."
                className={`w-full p-3 text-xs border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 leading-relaxed transition-all ${
                  needsManualJobText
                    ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20"
                    : "border-slate-200 focus:ring-indigo-500/20"
                }`}
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
      <div className="text-center pt-2 px-1">
        <button
          type="button"
          onClick={handleRunAdaptation}
          disabled={isProcessing || (!resumeFile && resumeText.trim().length < 15)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl shadow-xl shadow-slate-900/20 text-sm sm:text-base transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submetendo ao Teste de Estresse do JEV...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-400" />
              Analisar Aderência com Jev 
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-2">
          Travas CFM & Anti-Alucinação: se o perfil for incompatível, a adaptação mentirosa é bloqueada.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO DE RESULTADOS: DIAGNÓSTICO JEV                           */}
      {/* ========================================================================= */}
      {stressTest && (
        <div id="resultado-adaptacao" className="space-y-8 pt-6 border-t border-slate-200">
          {/* Card do Veredito Geral */}
          <div
            className={`rounded-3xl border-2 p-5 sm:p-8 shadow-sm transition-all ${
              stressTest.verdict === "kill"
                ? "bg-rose-50/60 border-rose-300"
                : stressTest.verdict === "fix"
                ? "bg-amber-50/60 border-amber-300"
                : "bg-emerald-50/60 border-emerald-300"
            }`}
          >
            {/* Topo do Veredito */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-black/5 pb-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
                  {stressTest.verdict === "kill" && (
                    <span className="bg-rose-600 text-white px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      Veredito: KILL
                    </span>
                  )}
                  {stressTest.verdict === "fix" && (
                    <span className="bg-amber-600 text-white px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Veredito: FIX
                    </span>
                  )}
                  {stressTest.verdict === "ship" && (
                    <span className="bg-emerald-600 text-white px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Veredito: SHIP
                    </span>
                  )}
                  <span className="text-slate-600 font-bold">
                    {stressTest.verdictLabel}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stressTest.verdict === "kill" && "Candidatura Não Recomendada (Desalinhada)"}
                  {stressTest.verdict === "fix" && "Candidatura Parcial (Requer Ajuste de Lacunas)"}
                  {stressTest.verdict === "ship" && "Candidatura Altamente Aderente (Aprovada para Envio)"}
                </h3>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-2xl">
                  {stressTest.verdictDescription}
                </p>
              </div>

              {/* Score Circular / Gauge */}
              <div className="flex items-center justify-between sm:justify-start gap-4 bg-white/80 p-4 rounded-2xl border border-black/5 shadow-sm w-full sm:w-auto shrink-0">
                <div className="text-left sm:text-right">
                  <div
                    className={`text-3xl sm:text-4xl font-black ${
                      stressTest.verdict === "kill"
                        ? "text-rose-600"
                        : stressTest.verdict === "fix"
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {stressTest.score}%
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Aderência Real
                  </div>
                </div>
                <div className="border-l border-slate-200 pl-3 text-[10px] text-slate-500 space-y-0.5 text-right sm:text-left">
                  <div><strong>Motor:</strong> Jev System One</div>
                  <div><strong>Modelo:</strong> {stressTest.model}</div>
                  <div><strong>Latência:</strong> {stressTest.latencyMs}ms</div>
                </div>
              </div>
            </div>

            {/* Diagnóstico Implacável */}
            <div className="pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Diagnóstico Implacável (Sem Alucinação e Sem Falsas Esperanças):
                </h4>
              </div>
              <div className="p-4 rounded-2xl bg-white/90 border border-black/5 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                "{stressTest.honestDiagnosis}"
              </div>
            </div>

            {/* Matriz das 6 Dimensões do JEV */}
            <div className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-700" />
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Avaliação Multidimensional pelo Jev:
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500">Notas de 0 a 4 (Escala TypeSafe)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stressTest.dimensions.map((dim) => {
                  const isLow = dim.score < 35;
                  const isMedium = dim.score >= 35 && dim.score < 65;
                  return (
                    <div
                      key={dim.key}
                      className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {dim.label}
                          </span>
                          <span
                            className={`text-xs font-black ${
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
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
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

            {/* Lacunas Críticas (Gaps) */}
            {stressTest.criticalGaps.length > 0 && (
              <div className="pt-6 space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Gaps Críticos Identificados na Vaga:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {stressTest.criticalGaps.map((gap, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white/90 border border-rose-200/80 text-xs text-slate-700 flex items-start gap-2 shadow-xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                      <span>{gap}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Roadmap para Atingir a Vaga */}
            {stressTest.roadmapToTarget.length > 0 && (
              <div className="pt-6 space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-600" />
                  Roadmap Realista para Atingir a Vaga:
                </h4>
                <div className="space-y-2">
                  {stressTest.roadmapToTarget.map((step, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white/90 border border-blue-200/70 text-xs text-slate-700 flex items-start gap-2.5 shadow-xs"
                    >
                      <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0">
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
          {/* AÇÃO PÓS-VEREDITO: BLOQUEIO OU BOTÃO "ADAPTAR CURRÍCULO"                   */}
          {/* ========================================================================= */}
          {!canAdapt || stressTest.verdict === "kill" ? (
            <div className="rounded-3xl border-2 border-slate-300 bg-slate-900 text-white p-6 sm:p-8 text-center space-y-4 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-amber-400">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-2 max-w-xl mx-auto">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                  Adaptação de Currículo Bloqueada pelo SmartVitae
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Para proteger sua credibilidade perante recrutadores e respeitar o código de ética
                  profissional (CFM/Conselhos Profissionais), o <strong>SmartVitae recusa-se a fabricar
                  experiências fictícias</strong> para vagas que não correspondem ao seu perfil.
                </p>
                <p className="text-xs text-slate-400">
                  Ao contrário de IAs generativas convencionais que inventam qualificações, nós priorizamos a verdade.
                  Utilize o roadmap acima para desenvolver essas competências ou submeta uma vaga condizente com seu histórico.
                </p>
              </div>

              <div className="pt-2">
                
              </div>
            </div>
          ) : (
            /* Botão Solicitado: Adaptar currículo */
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 sm:p-9 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Candidatura Viável Factualmente
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Pronto para adaptar seu currículo sem mentiras?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  Acesse o estúdio de adaptação para cruzar os dados do JEV, solicitar certificados
                  específicos para as lacunas encontradas e reestruturar seu currículo com base
                  estritamente nas suas evidências reais.
                </p>
              </div>

              <Link
                href="/adaptar"
                className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                Adaptar Currículo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
