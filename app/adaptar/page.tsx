"use client";

import { useState, useEffect } from "react";
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
  PlusCircle,
  Clock,
  Layers,
  Award,
} from "lucide-react";
import { EvidenceItem } from "@/lib/db/types";
import { StressTestResult } from "@/services/decisions/stress-test";

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

  // Estados de Reestruturação
  const [isRestructuring, setIsRestructuring] = useState(false);
  const [restructuredCv, setRestructuredCv] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Carrega dados da sessão ou da API de evidências
  useEffect(() => {
    // 1. Tenta carregar contexto da sessão
    const storedJobTitle = sessionStorage.getItem("nexovitae_job_title");
    const storedJobText = sessionStorage.getItem("nexovitae_job_text");
    const storedStressTest = sessionStorage.getItem("nexovitae_stress_test");

    if (storedJobTitle) setJobTitle(storedJobTitle);
    if (storedJobText) setJobText(storedJobText);
    if (storedStressTest) {
      try {
        setStressTest(JSON.parse(storedStressTest));
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Carrega a Base de Evidências Reais da API
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

      // Recarrega a base de evidências para refletir o novo documento classificado pelo JEV
      await loadRealEvidences();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setUploadingGapIndex(null);
    }
  };

  // Reestruturação estritamente factual do currículo
  const handleGenerateRestructuredCv = () => {
    setIsRestructuring(true);

    setTimeout(() => {
      const name = candidateName || "Candidato";
      const headerCrm = crmInfo ? ` • ${crmInfo}` : "";

      let text = `================================================================================\n`;
      text += `${name.toUpperCase()}${headerCrm}\n`;
      text += `ALVO: ${jobTitle.toUpperCase()}\n`;
      text += `Adequação Factual NexoVitae (Auditada pelo Jev System One)\n`;
      text += `================================================================================\n\n`;

      text += `RESUMO PROFISSIONAL & ALINHAMENTO COM A OPORTUNIDADE\n`;
      text += `--------------------------------------------------------------------------------\n`;
      text += `Profissional com trajetória comprovada, aplicando qualificações auditadas para atender às demandas de ${jobTitle}. `;
      text += `Todas as competências listadas abaixo correspondem a documentos e evidências reais validadas sem invenção de qualificações.\n\n`;

      // Agrupa evidências por seção
      const secoes: { [key: string]: EvidenceItem[] } = {};
      evidences.forEach((ev) => {
        const sec = ev.resume_section || "experiencia";
        if (!secoes[sec]) secoes[sec] = [];
        secoes[sec].push(ev);
      });

      const sectionLabels: { [key: string]: string } = {
        formacao: "FORMAÇÃO ACADÊMICA & RESIDÊNCIA MÉDICA",
        experiencia: "EXPERIÊNCIA PROFISSIONAL & ATUAÇÃO PRÁTICA",
        certificacoes: "CERTIFICAÇÕES & LICENÇAS COMPROVADAS",
        cursos: "CURSOS & CAPACITAÇÕES ESPECÍFICAS",
        projetos: "PROJETOS & INOVAÇÃO",
        pesquisa_publicacoes: "PESQUISA CIENTÍFICA & PUBLICAÇÕES",
      };

      Object.keys(secoes).forEach((secKey) => {
        const label = sectionLabels[secKey] || secKey.toUpperCase();
        text += `${label}\n`;
        text += `--------------------------------------------------------------------------------\n`;

        secoes[secKey].forEach((item) => {
          text += `• ${item.title}\n`;
          if (item.issuer_or_organization) {
            text += `  Instituição / Emissor: ${item.issuer_or_organization}\n`;
          }
          if (item.description) {
            text += `  Detalhes: ${item.description}\n`;
          }
          if (item.source_excerpt) {
            text += `  [Evidência Comprovada: "${item.source_excerpt.substring(0, 120)}..."]\n`;
          }
          text += `\n`;
        });
      });

      text += `\nTERMO DE CONFORMIDADE ÉTICA & CFM:\n`;
      text += `Nenhum título de especialista (RQE) ou experiência profissional foi fabricado para esta candidatura. `;
      text += `Currículo estruturado em conformidade com as resoluções de ética médica e validação documental.`;

      setRestructuredCv(text);
      setIsRestructuring(false);

      setTimeout(() => {
        document.getElementById("cv-reestruturado")?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }, 600);
  };

  const handleCopyCv = () => {
    if (!restructuredCv) return;
    navigator.clipboard.writeText(restructuredCv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* Botão de Voltar */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para o Teste de Estresse
        </Link>
      </div>

      {/* Cabeçalho do Estúdio */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Estúdio de Adaptação Factual NexoVitae
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Cruzamento de Dados & Adaptação do Currículo
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Vaga Alvo: <strong className="text-slate-800">{jobTitle}</strong>
            </p>
          </div>

          {stressTest && (
            <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shrink-0">
              <div className="text-right">
                <div className="text-2xl font-black text-blue-600">
                  {stressTest.score}%
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  Aderência JEV
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full uppercase bg-blue-600 text-white">
                {stressTest.verdict}
              </span>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-600 leading-relaxed bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong>Princípio de Zero Alucinação:</strong> O NexoVitae nunca inventará cargos, especialidades médicas ou
            certificações. Abaixo, a IA cruza os dados do JEV com seus documentos reais e permite enviar certificados
            específicos para suprir as lacunas antes de gerar a reestruturação final.
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CRUZAMENTO DO JEV: SOLICITAÇÃO DE CERTIFICADOS PARA SUPRIR LACUNAS     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              1. Lacunas Apontadas pelo Jev (Solicitação de Certificados)
            </h2>
            <p className="text-xs text-slate-500">
              Envie certificados específicos para cobrir cada lacuna e elevar sua aderência factual.
            </p>
          </div>
        </div>

        {stressTest && stressTest.criticalGaps.length > 0 ? (
          <div className="space-y-4">
            {stressTest.criticalGaps.map((gap, index) => {
              const hasUploaded = uploadedGaps[index];
              const isUploading = uploadingGapIndex === index;

              return (
                <div
                  key={index}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    hasUploaded
                      ? "bg-emerald-50/50 border-emerald-300"
                      : "bg-slate-50 border-slate-200/90 hover:border-blue-400"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          Requisito com Lacuna Documental
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium pl-8">
                        {gap}
                      </p>
                      {hasUploaded && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 pl-8 pt-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Certificado vinculado e classificado pelo Jev: <strong>{hasUploaded}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Botão de Envio de Certificado para esta Lacuna */}
                    <div className="shrink-0 pl-8 sm:pl-0">
                      <label
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
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
                            Analisando com Jev...
                          </>
                        ) : hasUploaded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Substituir Certificado
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            Enviar Certificado em PDF
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
      {/* 2. BASE DE EVIDÊNCIAS REAIS EXTRAÍDAS (ZERO INVENÇÃO)                     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                2. Evidências Reais Cadastradas ({evidences.length})
              </h2>
              <p className="text-xs text-slate-500">
                Somente os fatos comprovados extraídos do seu currículo e certificados enviados.
              </p>
            </div>
          </div>

          <Link
            href="/evidencias"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
          >
            Ver toda a Base de Evidências →
          </Link>
        </div>

        {evidences.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs space-y-2">
            <Database className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">Nenhuma evidência extraída ainda.</p>
            <p>Envie seu currículo ou certificados para que o JEV classifique os fatos comprovados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {evidences.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {ev.title}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize shrink-0">
                    {ev.resume_section}
                  </span>
                </div>

                {ev.issuer_or_organization && (
                  <div className="text-[11px] font-medium text-slate-600">
                    {ev.issuer_or_organization}
                  </div>
                )}

                {ev.source_excerpt && (
                  <p className="text-[11px] text-slate-500 italic line-clamp-2">
                    "{ev.source_excerpt}"
                  </p>
                )}

                <div className="pt-1 flex items-center gap-2 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Classificado pelo JEV • Fato Comprovado</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. REESTRUTURAR CURRÍCULO COM BASE NAS EVIDÊNCIAS REAIS                   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                3. Reestruturação do Currículo para a Vaga
              </h2>
              <p className="text-xs text-slate-500">
                Reorganiza o seu currículo em formato ATS de 1 coluna usando estritamente suas evidências reais.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateRestructuredCv}
            disabled={isRestructuring || evidences.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isRestructuring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Reestruturando com Fatos Reais...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Reestruturar Currículo Factual
              </>
            )}
          </button>
        </div>

        {restructuredCv && (
          <div id="cv-reestruturado" className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Currículo Adaptado Pronto (Formato ATS Texto Puro / 1 Coluna):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-sm transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar Texto
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Imprimir / PDF
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner max-h-[500px] overflow-y-auto">
              {restructuredCv}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
