"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  UploadCloud,
  FileText,
  CheckCircle2,
  ArrowLeft,
  Copy,
  Download,
  Check,
  Loader2,
  Database,
  GraduationCap,
  Briefcase,
  Wrench,
  Languages,
  Award,
  BookOpen,
  FolderGit2,
  FileCheck,
  XCircle,
  RotateCcw,
  RefreshCw,
  Search,
  Printer,
  Globe,
} from "lucide-react";
import { EvidenceItem } from "@/lib/db/types";
import { StressTestResult } from "@/services/decisions/stress-test";

type FilterCategory =
  | "todos"
  | "formacao"
  | "experiencia"
  | "habilidades"
  | "idiomas"
  | "certificacoes"
  | "cursos"
  | "projetos"
  | "publicacoes";

export default function AdaptarPage() {
  const [jobTitle, setJobTitle] = useState("Vaga Pretendida");
  const [jobText, setJobText] = useState("");
  const [stressTest, setStressTest] = useState<StressTestResult | null>(null);
  const [evidences, setEvidences] = useState<EvidenceItem[]>([]);
  const [candidateName, setCandidateName] = useState("");
  const [crmInfo, setCrmInfo] = useState<string | null>(null);

  // Estados de Upload para cobrir lacunas
  const [uploadingGapIndex, setUploadingGapIndex] = useState<number | null>(null);
  const [uploadedGaps, setUploadedGaps] = useState<{ [key: number]: string }>({});
  // Lacunas marcadas como "Não possuo essa experiência/certificação"
  const [declaredAbsentGaps, setDeclaredAbsentGaps] = useState<{ [key: number]: boolean }>({});

  // Filtros e busca da Tabela de Evidências
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("todos");
  const [searchFilter, setSearchFilter] = useState("");
  const [isReorganizing, setIsReorganizing] = useState(false);

  // Estados de Reestruturação do Currículo
  const [isRestructuring, setIsRestructuring] = useState(false);
  const [restructuredCv, setRestructuredCv] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<"auto" | "pt" | "en">("auto");
  const [copied, setCopied] = useState(false);

  // Carrega dados da sessão ou da API de evidências
  useEffect(() => {
    const storedJobTitle =
      sessionStorage.getItem("smartvitae_job_title") ||
      sessionStorage.getItem("nexovitae_job_title");
    const storedJobText =
      sessionStorage.getItem("smartvitae_job_text") ||
      sessionStorage.getItem("nexovitae_job_text");
    const storedStressTest =
      sessionStorage.getItem("smartvitae_stress_test") ||
      sessionStorage.getItem("nexovitae_stress_test");

    if (storedJobTitle) setJobTitle(storedJobTitle);
    if (storedJobText) setJobText(storedJobText);
    if (storedStressTest) {
      try {
        setStressTest(JSON.parse(storedStressTest));
      } catch (e) {
        console.error(e);
      }
    }

    loadRealEvidences();
  }, []);

  const loadRealEvidences = async () => {
    try {
      const res = await fetch("/api/evidence");
      const data = await res.json();
      if (data.success) {
        setEvidences(data.evidence || []);
        if (data.profile) {
          if (data.profile.full_name) setCandidateName(data.profile.full_name);
          if (data.profile.crm_number) {
            const state = data.profile.crm_state ? `-${data.profile.crm_state}` : "";
            setCrmInfo(`CRM ${data.profile.crm_number}${state}`);
          }
        }
      }
    } catch (err) {
      console.error("Falha ao carregar evidências:", err);
    }
  };

  // Reorganizar base de evidências via Claude sob demanda
  const handleReorganizeWithClaude = async () => {
    setIsReorganizing(true);
    try {
      const res = await fetch("/api/evidence/reorganize", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao reorganizar.");
      }
      await loadRealEvidences();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setIsReorganizing(false);
    }
  };

  // Upload de certificado para suprir uma lacuna específica apontada pelo JEV
  const handleUploadCertificateForGap = async (gapIndex: number, file: File) => {
    setUploadingGapIndex(gapIndex);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha no envio do certificado.");
      }

      setUploadedGaps((prev) => ({
        ...prev,
        [gapIndex]: file.name,
      }));

      // Remove da marcação de "não possuo" se tinha marcado antes
      setDeclaredAbsentGaps((prev) => {
        const updated = { ...prev };
        delete updated[gapIndex];
        return updated;
      });

      await loadRealEvidences();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setUploadingGapIndex(null);
    }
  };

  // Marcar lacuna como "Não possuo essa experiência/certificação"
  const handleToggleAbsentGap = (gapIndex: number) => {
    setDeclaredAbsentGaps((prev) => ({
      ...prev,
      [gapIndex]: !prev[gapIndex],
    }));
  };

  // Reestruturação do currículo via Claude
  const handleGenerateRestructuredCv = async () => {
    setIsRestructuring(true);

    try {
      // Coleta os requisitos que o candidato expressamente marcou como "não possuo"
      const declaredGapsList = stressTest?.criticalGaps
        ? stressTest.criticalGaps.filter((_, idx) => declaredAbsentGaps[idx])
        : [];

      const response = await fetch("/api/generate-cv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTitle,
          jobText,
          evidences,
          candidateName,
          crmInfo,
          declaredGaps: declaredGapsList,
          targetLang,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao gerar o currículo.");
      }

      setRestructuredCv(data.restructuredCv);

      setTimeout(() => {
        document.getElementById("cv-reestruturado")?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch (error: any) {
      console.error(error);
      alert(`Houve um erro ao processar o currículo: ${error.message || "Tente novamente."}`);
    } finally {
      setIsRestructuring(false);
    }
  };

  const handleCopyCv = () => {
    if (!restructuredCv) return;
    navigator.clipboard.writeText(restructuredCv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Exportação limpa e isolada em PDF / Impressão sem elementos da página web
  const handlePrintDocument = () => {
    if (!restructuredCv) return;

    // Cria ou reutiliza iframe isolado para não capturar elementos visuais do site
    let iframe = document.getElementById("smartvitae-isolated-print-frame") as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "smartvitae-isolated-print-frame";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.zIndex = "-9999";
      document.body.appendChild(iframe);
    }

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      window.print();
      return;
    }

    const cleanCandidateName = candidateName || "Curriculo";
    const cleanJobTitle = jobTitle || "Oportunidade";
    const docTitle = `${cleanCandidateName}_${cleanJobTitle}_Resume`;

    const escapedText = restructuredCv
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html>
<html lang="${targetLang === "en" ? "en" : "pt-BR"}">
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    @page {
      size: letter portrait;
      margin: 18mm 18mm 18mm 18mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, "Nimbus Sans L", "Liberation Sans", sans-serif;
      font-size: 10.5pt;
      line-height: 1.45;
      color: #111827;
      background: #ffffff;
      padding: 0;
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .resume-sheet {
      width: 100%;
      margin: 0 auto;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 10.5pt;
      line-height: 1.45;
      color: #111827;
    }
  </style>
</head>
<body>
  <div class="resume-sheet">${escapedText}</div>
</body>
</html>`);
    iframeDoc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 300);
  };

  // Download do currículo em texto puro formatado
  const handleDownloadTxt = () => {
    if (!restructuredCv) return;
    const blob = new Blob([restructuredCv], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = (candidateName || "Candidato").replace(/[^a-zA-Z0-9À-ÿ]/g, "_");
    const safeJob = (jobTitle || "Vaga").replace(/[^a-zA-Z0-9À-ÿ]/g, "_");
    link.download = `${safeName}_${safeJob}_Resume.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Contagem por categoria para as abas
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      todos: evidences.length,
      formacao: 0,
      experiencia: 0,
      habilidades: 0,
      idiomas: 0,
      certificacoes: 0,
      cursos: 0,
      projetos: 0,
      publicacoes: 0,
    };

    evidences.forEach((ev) => {
      const sec = (ev.resume_section || "experiencia").toLowerCase();
      if (sec === "formacao") counts.formacao++;
      else if (sec === "idiomas" || ev.evidence_type === "idioma") counts.idiomas++;
      else if (sec === "certificacoes" || ev.evidence_type === "certificacao_profissional" || ev.evidence_type === "registro_profissional") counts.certificacoes++;
      else if (sec === "cursos" || ev.evidence_type === "curso_livre" || ev.evidence_type === "curso_aperfeicoamento") counts.cursos++;
      else if (sec === "projetos" || ev.evidence_type === "projeto") counts.projetos++;
      else if (sec === "pesquisa_publicacoes" || ev.evidence_type === "publicacao") counts.publicacoes++;
      else if (ev.title.toLowerCase().includes("habilidade") || ev.title.toLowerCase().includes("skill") || ev.description?.toLowerCase().includes("raciocínio")) counts.habilidades++;
      else counts.experiencia++;
    });

    return counts;
  }, [evidences]);

  // Filtragem das evidências para exibição
  const filteredEvidences = useMemo(() => {
    return evidences.filter((ev) => {
      const sec = (ev.resume_section || "experiencia").toLowerCase();
      const matchesSearch =
        searchFilter.trim() === "" ||
        ev.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (ev.issuer_or_organization && ev.issuer_or_organization.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (ev.description && ev.description.toLowerCase().includes(searchFilter.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedCategory === "todos") return true;
      if (selectedCategory === "formacao") return sec === "formacao";
      if (selectedCategory === "idiomas") return sec === "idiomas" || ev.evidence_type === "idioma";
      if (selectedCategory === "certificacoes") return sec === "certificacoes" || ev.evidence_type === "certificacao_profissional" || ev.evidence_type === "registro_profissional";
      if (selectedCategory === "cursos") return sec === "cursos" || ev.evidence_type === "curso_livre" || ev.evidence_type === "curso_aperfeicoamento";
      if (selectedCategory === "projetos") return sec === "projetos" || ev.evidence_type === "projeto";
      if (selectedCategory === "publicacoes") return sec === "pesquisa_publicacoes" || ev.evidence_type === "publicacao";
      if (selectedCategory === "habilidades") return ev.title.toLowerCase().includes("habilidade") || ev.description?.toLowerCase().includes("skill");
      if (selectedCategory === "experiencia") return sec === "experiencia";

      return true;
    });
  }, [evidences, selectedCategory, searchFilter]);

  const getCategoryBadge = (section: string) => {
    const s = section.toLowerCase();
    if (s === "formacao") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <GraduationCap className="w-3 h-3" /> Formação
        </span>
      );
    }
    if (s === "idiomas" || s === "idioma") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
          <Languages className="w-3 h-3" /> Idiomas
        </span>
      );
    }
    if (s === "certificacoes" || s === "certificacao_profissional") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <Award className="w-3 h-3" /> Certificação
        </span>
      );
    }
    if (s === "cursos" || s === "curso_livre") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
          <BookOpen className="w-3 h-3" /> Curso
        </span>
      );
    }
    if (s === "projetos" || s === "projeto") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
          <FolderGit2 className="w-3 h-3" /> Projeto
        </span>
      );
    }
    if (s === "pesquisa_publicacoes" || s === "publicacao") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <FileCheck className="w-3 h-3" /> Publicação
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
        <Briefcase className="w-3 h-3" /> Experiência
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Botão de Voltar */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Análise Inicial
        </Link>
        <span className="text-xs font-medium text-slate-400">
          SmartVitae • Pipeline Factual JEV + Claude
        </span>
      </div>

      {/* Header do Estúdio */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Estúdio de Adaptação Factual
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Adequação de Currículo para a Vaga
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Candidato: <strong className="text-slate-900">{candidateName || "Identificado"}</strong>
              {crmInfo ? ` (${crmInfo})` : ""} • Vaga Alvo: <strong className="text-blue-700">{jobTitle}</strong>
            </p>
          </div>

          {stressTest && (
            <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shrink-0">
              <div className="text-right">
                <div className="text-2xl font-black text-blue-600">
                  {stressTest.score}%
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  Aderência Factual
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full uppercase bg-blue-600 text-white">
                {stressTest.verdict}
              </span>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-600 leading-relaxed bg-blue-50/40 p-4 rounded-2xl border border-blue-100/80 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong>Conformidade Ética & Zero Alucinação:</strong> Os dados abaixo foram extraídos do seu documento,
            filtrados pelo <strong>JEV</strong> e estruturados com precisão pelo <strong>Claude</strong>.
            Nenhum CRM, experiência ou competência é inventada. Você pode suprir lacunas enviando certificados ou
            declarar com honestidade os requisitos que não possui.
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESTAQUE PRINCIPAL (HERO CTA): REESTRUTURAR O CURRÍCULO COM IA             */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-7 sm:p-9 text-white shadow-xl shadow-indigo-950/20 border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Recurso Principal • Padrão Médicos Híbridos & Harvard
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Reestruturar Currículo Factual com Claude 3.5 Sonnet
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              O cérebro da IA reorganiza suas evidências comprovadas no formato ATS ideal de 1 coluna para <strong className="text-blue-200">{jobTitle}</strong>.
              Ele destaca forças reais, projetos em IA com limitações explícitas, verbos de ação e zero alucinações.
            </p>

            {/* Seletor de Idioma e Template */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-bold text-slate-300">Idioma e Padrão do Currículo:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-lg">
                <button
                  type="button"
                  onClick={() => setTargetLang("auto")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border cursor-pointer ${
                    targetLang === "auto"
                      ? "bg-blue-600 text-white border-blue-400 shadow-sm"
                      : "bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>Automático</span>
                  <span className="text-[10px] opacity-75">Detectar Vaga</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetLang("pt")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border cursor-pointer ${
                    targetLang === "pt"
                      ? "bg-emerald-600 text-white border-emerald-400 shadow-sm"
                      : "bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>🇧🇷 Português</span>
                  <span className="text-[10px] opacity-75">CFM / A4</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetLang("en")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border cursor-pointer ${
                    targetLang === "en"
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-sm"
                      : "bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>🇺🇸 English</span>
                  <span className="text-[10px] opacity-75">US Resume</span>
                </button>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2">
            <button
              type="button"
              onClick={handleGenerateRestructuredCv}
              disabled={isRestructuring || evidences.length === 0}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
            >
              {isRestructuring ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Claude está reestruturando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                  <span>Reestruturar Currículo Factual Agora</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-400 text-center font-medium">
              Baseado estritamente em {evidences.length} fatos auditados
            </span>
          </div>
        </div>

        {/* Bloco de Resultado do Currículo Gerado com Pré-Visualização de Folha A4 */}
        {restructuredCv && (
          <div id="cv-reestruturado" className="mt-8 pt-7 border-t border-slate-800/80 space-y-6">
            {/* Checklist de Conformidade Factual */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Conformidade com o Checklist Médicos Híbridos & Harvard:
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                  <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    ✓ Layout ATS 1 Coluna
                  </span>
                  <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    ✓ Verbos de Ação
                  </span>
                  <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    ✓ Limitações Fatuais Explícitas
                  </span>
                  <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    ✓ Zero Métricas Falsas
                  </span>
                </div>
              </div>

              {/* Botões de Ação do Documento */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCv}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-300" />
                      Copiar Texto
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-300" />
                  Baixar TXT
                </button>

                <button
                  type="button"
                  onClick={handlePrintDocument}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / Salvar PDF
                </button>
              </div>
            </div>

            {/* Folha de Papel A4 / Carta Realista */}
            <div className="flex justify-center p-2 sm:p-4 bg-slate-950/60 rounded-3xl border border-slate-800/60">
              <div
                id="documento-cv-impressao"
                className="w-full max-w-[850px] bg-white text-slate-900 rounded-2xl shadow-2xl p-8 sm:p-12 md:p-16 border border-slate-200 select-text"
                style={{
                  minHeight: "1050px",
                  fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
                }}
              >
                <div className="text-[10pt] sm:text-[10.5pt] leading-[1.48] text-slate-900 whitespace-pre-wrap font-normal selection:bg-blue-100 selection:text-blue-900">
                  {restructuredCv}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. SEÇÃO DE LACUNAS DA VAGA (GAPS): ADICIONAR OU DECLARAR AUSENTE         */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              1. Requisitos com Lacunas Identificados pelo JEV
            </h2>
            <p className="text-xs text-slate-500">
              Veja exatamente quais requisitos da vaga não foram encontrados no currículo. Adicione o comprovante ou clique em "Não possuo".
            </p>
          </div>
        </div>

        {stressTest && stressTest.criticalGaps.length > 0 ? (
          <div className="space-y-4">
            {stressTest.criticalGaps.map((gap, index) => {
              const hasUploaded = uploadedGaps[index];
              const isAbsent = declaredAbsentGaps[index];
              const isUploading = uploadingGapIndex === index;

              return (
                <div
                  key={index}
                  className={`p-5 rounded-2xl border transition-all ${
                    hasUploaded
                      ? "bg-emerald-50/60 border-emerald-300"
                      : isAbsent
                      ? "bg-slate-100/70 border-slate-300/80 opacity-90"
                      : "bg-slate-50 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 text-xs font-extrabold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          Requisito Ausente no Currículo Original:
                        </span>
                      </div>
                      
                      <p className="text-xs sm:text-sm text-slate-800 font-semibold pl-8 leading-snug">
                        {gap}
                      </p>

                      {hasUploaded && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 pl-8 pt-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Comprovante auditado: <strong>{hasUploaded}</strong></span>
                        </div>
                      )}

                      {isAbsent && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 pl-8 pt-1">
                          <XCircle className="w-4 h-4 text-slate-500" />
                          <span>Marcado: <strong>Não possuo essa qualificação</strong> (O Claude não forçará este ponto)</span>
                        </div>
                      )}
                    </div>

                    {/* Ações da Lacuna: Upload vs Não Possuo */}
                    <div className="shrink-0 flex flex-wrap sm:flex-nowrap items-center gap-2 pl-8 lg:pl-0">
                      {/* Botão de Enviar Certificado */}
                      <label
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                          isUploading
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                            : hasUploaded
                            ? "bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50"
                            : "bg-blue-600 hover:bg-blue-500 text-white"
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Analisando com JEV...
                          </>
                        ) : hasUploaded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Substituir
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            Adicionar Certificado
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          disabled={isUploading}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadCertificateForGap(index, f);
                          }}
                        />
                      </label>

                      {/* Botão Não Possuo essa Experiência */}
                      {!hasUploaded && (
                        <button
                          type="button"
                          onClick={() => handleToggleAbsentGap(index)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isAbsent
                              ? "bg-slate-800 text-white border-slate-800 hover:bg-slate-700"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {isAbsent ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
                              Desfazer Marcação
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                              Não Possuo
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Nenhuma lacuna crítica aberta. Todas as competências principais da vaga possuem respaldo factual.</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. BASE DE EVIDÊNCIAS ESTRUTURADA POR INTELIGÊNCIA (TABELA / ABAS)        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                2. Base de Dados Estruturada por Inteligência ({evidences.length} fatos)
              </h2>
              <p className="text-xs text-slate-500">
                Fatos auditados e organizados pelo Claude e JEV em categorias reais (Zero Frases Soltas).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReorganizeWithClaude}
              disabled={isReorganizing || evidences.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isReorganizing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Filtrando com Claude...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  Refiltrar com Claude
                </>
              )}
            </button>

            <Link
              href="/evidencias"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors ml-2"
            >
              Auditoria Completa →
            </Link>
          </div>
        </div>

        {/* Abas de Categorias */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory("todos")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "todos"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos ({categoryCounts.todos})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("formacao")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "formacao"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            Formação ({categoryCounts.formacao})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("experiencia")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "experiencia"
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-800 hover:bg-blue-100"
            }`}
          >
            Experiência ({categoryCounts.experiencia})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("certificacoes")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "certificacoes"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            Certificações ({categoryCounts.certificacoes})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("idiomas")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "idiomas"
                ? "bg-cyan-600 text-white"
                : "bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
            }`}
          >
            Idiomas ({categoryCounts.idiomas})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("cursos")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "cursos"
                ? "bg-purple-600 text-white"
                : "bg-purple-50 text-purple-800 hover:bg-purple-100"
            }`}
          >
            Cursos ({categoryCounts.cursos})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("projetos")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "projetos"
                ? "bg-indigo-600 text-white"
                : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
            }`}
          >
            Projetos ({categoryCounts.projetos})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("publicacoes")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "publicacoes"
                ? "bg-rose-600 text-white"
                : "bg-rose-50 text-rose-800 hover:bg-rose-100"
            }`}
          >
            Publicações ({categoryCounts.publicacoes})
          </button>
        </div>

        {/* Campo de Busca Rápida */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cargo, competência ou instituição..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Tabela Estruturada de Evidências */}
        {filteredEvidences.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs space-y-2">
            <Database className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">Nenhum fato encontrado nesta categoria.</p>
            <p>Selecione "Todos" ou reestruture a base com o Claude.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Qualificação / Título</th>
                  <th className="py-3 px-4">Instituição / Emissor</th>
                  <th className="py-3 px-4">Detalhamento Factual Comprovado</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredEvidences.map((ev) => (
                  <tr key={ev.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      {getCategoryBadge(ev.resume_section || ev.evidence_type)}
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-bold text-slate-900 leading-snug">
                        {ev.title}
                      </div>
                      {ev.start_date && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {ev.start_date}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 align-top text-slate-700 font-medium">
                      {ev.issuer_or_organization || "—"}
                    </td>
                    <td className="py-3.5 px-4 align-top text-slate-600 max-w-md">
                      <p className="line-clamp-2 leading-relaxed">
                        {ev.description || ev.source_excerpt || "Sem detalhamento adicional."}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Comprovado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
