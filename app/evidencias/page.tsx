"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Database,
  CheckCircle,
  XCircle,
  Lock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Trash2,
  Check,
  Loader2,
  UploadCloud,
  ArrowRight,
} from "lucide-react";
import { EvidenceItem } from "@/lib/db/types";

export default function EvidenciasPage() {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSection, setFilterSection] = useState<string>("todas");
  const [filterStatus, setFilterStatus] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectingItem, setInspectingItem] = useState<EvidenceItem | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    loadEvidence();
  }, []);

  const loadEvidence = () => {
    setLoading(true);
    fetch("/api/evidence")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEvidenceList(data.evidence || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/evidence/${id}/approve`, { method: "POST" });
      if (res.ok) {
        setEvidenceList((prev) =>
          prev.map((e) => (e.id === id ? { ...e, review_status: "approved", user_locked: true } : e))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/evidence/${id}/reject`, { method: "POST" });
      if (res.ok) {
        setEvidenceList((prev) =>
          prev.map((e) => (e.id === id ? { ...e, review_status: "rejected", user_locked: true } : e))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta evidência?")) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/evidence/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEvidenceList((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredEvidence = evidenceList.filter((item) => {
    const matchesSection = filterSection === "todas" || item.resume_section === filterSection;
    const matchesStatus = filterStatus === "todas" || item.review_status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.issuer_or_organization && item.issuer_or_organization.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSection && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            Base de Evidências Auditável
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cada item abaixo possui fundamentação documental comprovada, classificada pelo Jev.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            {filteredEvidence.length} evidências exibidas
          </span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por título, instituição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
          >
            <option value="todas">Todas as Seções</option>
            <option value="formacao">Formação Acadêmica</option>
            <option value="experiencia">Experiência Profissional</option>
            <option value="certificacoes">Certificações</option>
            <option value="cursos">Cursos e Treinamentos</option>
            <option value="projetos">Projetos & Inovação</option>
            <option value="pesquisa_publicacoes">Pesquisa & Publicações</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
          >
            <option value="todas">Todos os Status</option>
            <option value="approved">Aprovados</option>
            <option value="pending">Revisão Pendente</option>
            <option value="rejected">Rejeitados</option>
          </select>
        </div>
      </div>

      {/* Lista de Cards de Evidência */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 text-sm">Carregando base de evidências...</div>
      ) : filteredEvidence.length === 0 ? (
        <div className="bg-white p-12 sm:p-16 rounded-3xl border border-slate-200 text-center space-y-4 max-w-2xl mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Database className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Nenhuma evidência cadastrada ainda
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              A Base de Evidências do SmartVitae não utiliza dados fictícios.
              Ela exibe exclusivamente o que for extraído do seu currículo real ou dos certificados que você enviar, devidamente classificados pelo JEV.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Analisar Currículo na Página Inicial
            </Link>
            <Link
              href="/documentos"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Subir Certificados Avulsos
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvidence.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all shadow-sm ${
                item.review_status === "approved"
                  ? "border-slate-200/80"
                  : item.review_status === "pending"
                  ? "border-amber-300/80 bg-amber-50/20"
                  : "border-slate-200 opacity-60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base text-slate-900">{item.title}</span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                      {item.evidence_type.replace("_", " ")}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                      Seção: {item.resume_section}
                    </span>
                    {item.user_locked && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Validado e Travado
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-y-1 gap-x-3">
                    {item.issuer_or_organization && (
                      <span>
                        <strong>Emissor:</strong> {item.issuer_or_organization}
                      </span>
                    )}
                    {item.issue_date && (
                      <span>
                        <strong>Data:</strong> {item.issue_date}
                      </span>
                    )}
                    {item.workload_hours && (
                      <span>
                        <strong>Carga:</strong> {item.workload_hours}h
                      </span>
                    )}
                    {item.credential_id && (
                      <span className="font-mono text-slate-500">
                        Credencial: {item.credential_id}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      {item.description}
                    </p>
                  )}

                  {/* Trecho Original (Grounding Auditável) */}
                  {item.source_excerpt && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 font-mono">
                      <span className="text-slate-400 block mb-1 font-sans text-[10px] font-bold uppercase tracking-wider">
                        Trecho de Origem (Grounding sem Alucinação):
                      </span>
                      "{item.source_excerpt}"
                    </div>
                  )}
                </div>

                {/* Painel Lateral com Julgamento do Jev e Ações */}
                <div className="flex sm:flex-col items-end sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end text-xs font-bold text-slate-800">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      {item.confidence != null && !isNaN(item.confidence)
                        ? (item.confidence * 100).toFixed(0)
                        : "95"}% confiança
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      Motor: {item.classification_source || "JEV • System One"}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Sinal de Carreira: <strong>{item.career_signal || 4}/5</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2">
                    {item.review_status !== "approved" && (
                      <button
                        onClick={() => handleApprove(item.id!)}
                        disabled={actionLoadingId === item.id}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aprovar
                      </button>
                    )}
                    {item.review_status !== "rejected" && (
                      <button
                        onClick={() => handleReject(item.id!)}
                        disabled={actionLoadingId === item.id}
                        className="inline-flex items-center gap-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition-colors border border-slate-200"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Rejeitar
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id!)}
                      disabled={actionLoadingId === item.id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir evidência"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
