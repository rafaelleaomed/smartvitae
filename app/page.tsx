"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  CheckCircle2,
  FileText,
  Database,
  ArrowRight,
  Sparkles,
  Lock,
  ExternalLink,
  Linkedin,
  AlertTriangle,
} from "lucide-react";
import { EvidenceItem, DocumentRecord } from "@/lib/db/types";

export default function DashboardPage() {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/evidence")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEvidenceList(data.evidence || []);
          setDocuments(data.documents || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const approvedCount = evidenceList.filter((e) => e.review_status === "approved").length;
  const pendingCount = evidenceList.filter((e) => e.review_status === "pending").length;
  const highSignalCount = evidenceList.filter((e) => e.career_signal >= 4).length;

  return (
    <div className="space-y-8">
      {/* Banner de Boas-vindas da Comunidade Médicos Híbridos */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold backdrop-blur-sm border border-blue-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            Piloto Inicial • Comunidade Médicos Híbridos
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Base de Evidências Curriculares Auditável
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            Elimine a alucinação em currículos. Cada afirmação é fundamentada em certificados, 
            Lattes ou perfil do LinkedIn, com classificação rápida pelo <strong>Jev (TypeSafe AI)</strong> e 
            respeito estrito às resoluções do CFM (CRM e RQE).
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/documentos"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/30 text-sm"
            >
              <FileText className="w-4 h-4" />
              Subir Certificados / Lattes
            </Link>
            <Link
              href="/documentos?tab=linkedin"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium px-4 py-2.5 rounded-xl transition-all border border-slate-700 text-sm"
            >
              <Linkedin className="w-4 h-4 text-blue-400" />
              Importar Perfil do LinkedIn
            </Link>
            <Link
              href="/evidencias"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2.5 rounded-xl transition-all border border-white/10 text-sm backdrop-blur-sm"
            >
              <Database className="w-4 h-4" />
              Ver Base de Evidências ({evidenceList.length})
            </Link>
          </div>
        </div>
      </div>

      {/* Métricas do Piloto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Evidências Aprovadas
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{approvedCount}</span>
            <span className="text-xs text-slate-500">aptas para currículo</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Revisão Pendente
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{pendingCount}</span>
            <span className="text-xs text-amber-700 font-medium">exigem validação humana</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sinais Diferenciadores
            </span>
            <Sparkles className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{highSignalCount}</span>
            <span className="text-xs text-slate-500">sinal de carreira 4 ou 5</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Documentos & Fontes
            </span>
            <FileText className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{documents.length}</span>
            <span className="text-xs text-slate-500">PDFs e integrações</span>
          </div>
        </div>
      </div>

      {/* Seção Principal: Evidências Recentes Classificadas pelo Jev */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Evidências na Base Ativa
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Classificadas semanticamente pelo Jev (System One) com controle anti-fraude CFM.
            </p>
          </div>
          <Link
            href="/evidencias"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Abrir gerenciador completo
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Carregando evidências...</div>
        ) : evidenceList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-medium text-slate-700">Nenhuma evidência registrada ainda.</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Envie seu primeiro certificado em PDF ou importe seu perfil do LinkedIn para começar.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {evidenceList.slice(0, 5).map((item) => (
              <div key={item.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900 truncate">
                      {item.title}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {item.evidence_type.replace("_", " ")}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/50">
                      Seção: {item.resume_section}
                    </span>
                    {item.user_locked && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Validado por Usuário
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {item.issuer_or_organization} • {item.issue_date || "Data não especificada"}
                    {item.workload_hours ? ` • Carga horária: ${item.workload_hours}h` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-slate-800">
                      {(item.confidence * 100).toFixed(0)}% confiança
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      Fonte: {item.classification_source}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      item.review_status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : item.review_status === "pending"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {item.review_status === "approved"
                      ? "Aprovado"
                      : item.review_status === "pending"
                      ? "Revisão Necessária"
                      : item.review_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Regras Éticas CFM em Destaque */}
      <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-6 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-amber-900">
            Regra Ética do Piloto (Resolução CFM 2.336/2023)
          </h3>
          <p className="text-xs text-amber-800 leading-relaxed">
            O sistema impede terminantemente o uso de expressões como <em>"especialista em..."</em> a menos que haja 
            comprovação formal com número de <strong>RQE</strong> cadastrado. Pós-graduações <em>lato sensu</em>, cursos livres e 
            atuações clínicas práticas são etiquetados com precisão para não induzir recrutadores a erro.
          </p>
        </div>
      </div>
    </div>
  );
}
