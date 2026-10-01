"use client";

import { useState, useEffect } from "react";
import {
  UploadCloud,
  Linkedin,
  FileCheck2,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { DocumentRecord } from "@/lib/db/types";

export default function DocumentosPage() {
  const [activeTab, setActiveTab] = useState<"upload" | "linkedin">("upload");
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // LinkedIn Form State
  const [linkedinUrl, setLinkedinUrl] = useState("https://www.linkedin.com/in/");
  const [rawLinkedInText, setRawLinkedInText] = useState("");
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [isImportingLinkedIn, setIsImportingLinkedIn] = useState(false);

  useEffect(() => {
    loadDocuments();
    // Checa se há query param ?tab=linkedin
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "linkedin") {
      setActiveTab("linkedin");
    }
  }, []);

  const loadDocuments = () => {
    fetch("/api/evidence")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDocuments(data.documents || []);
        }
      });
  };

  // Upload de Arquivos (PDF, DOCX)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadFeedback(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha no envio do arquivo.");
      }

      setUploadFeedback({
        type: "success",
        message: `Arquivo "${file.name}" processado com sucesso! O Jev identificou como "${data.evidence?.title}".`,
      });
      loadDocuments();
    } catch (err: any) {
      setUploadFeedback({
        type: "error",
        message: err.message,
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Ingestão do LinkedIn
  const handleLinkedInImport = async () => {
    if (!linkedinUrl || linkedinUrl.trim() === "https://www.linkedin.com/in/") {
      setUploadFeedback({
        type: "error",
        message: "Por favor, informe a URL completa do seu perfil do LinkedIn.",
      });
      return;
    }

    setIsImportingLinkedIn(true);
    setUploadFeedback(null);

    try {
      const res = await fetch("/api/documents/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileUrl: linkedinUrl.trim(),
          rawText: rawLinkedInText.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar LinkedIn.");
      }

      if (data.requiresAssistedExport) {
        setShowTextFallback(true);
        setUploadFeedback({
          type: "info",
          message: data.message,
        });
      } else {
        setUploadFeedback({
          type: "success",
          message: data.message || "Perfil do LinkedIn importado com sucesso!",
        });
        setShowTextFallback(false);
        setRawLinkedInText("");
        loadDocuments();
      }
    } catch (err: any) {
      setUploadFeedback({
        type: "error",
        message: err.message,
      });
    } finally {
      setIsImportingLinkedIn(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Ingestão de Documentos & Fontes
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Envie seus certificados, diplomas ou integre o link do LinkedIn para enriquecer a base de evidências.
        </p>
      </div>

      {/* Seletor de Abas */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab("upload")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "upload"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          Upload de Arquivos (PDF, DOCX, Lattes)
        </button>
        <button
          onClick={() => setActiveTab("linkedin")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "linkedin"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Linkedin className="w-4 h-4 text-blue-500" />
          Importar do LinkedIn (Link de Perfil)
        </button>
      </div>

      {/* Alerta de Feedback */}
      {uploadFeedback && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 text-sm border ${
            uploadFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : uploadFeedback.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-blue-50 text-blue-800 border-blue-200"
          }`}
        >
          {uploadFeedback.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : uploadFeedback.type === "error" ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          )}
          <p className="leading-relaxed">{uploadFeedback.message}</p>
        </div>
      )}

      {/* Conteúdo Aba 1: Upload de Arquivos */}
      {activeTab === "upload" && (
        <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 transition-colors text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">
              {isUploading ? "Processando e extraindo evidências..." : "Solte seus certificados ou currículo Lattes aqui"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Suporta PDF nativo, DOCX e imagens. O sistema lê o texto, remove CPF/dados sensíveis e envia ao Jev para classificação automática.
            </p>
          </div>
          <div>
            <label className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-xl cursor-pointer shadow-sm text-sm transition-all">
              <FileText className="w-4 h-4" />
              Selecionar Arquivo no Computador
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.png,.jpg,.jpeg"
                disabled={isUploading}
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>
      )}

      {/* Conteúdo Aba 2: LinkedIn Ingestion */}
      {activeTab === "linkedin" && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Linkedin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Importação Direta por Link do Perfil LinkedIn
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Insira o link público do seu perfil no LinkedIn. O sistema analisa suas experiências, 
                formações e certificações e cria evidências auditáveis prontas para adaptação.
              </p>
            </div>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Link do seu Perfil LinkedIn
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/seu-perfil"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <button
                  onClick={handleLinkedInImport}
                  disabled={isImportingLinkedIn}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm"
                >
                  {isImportingLinkedIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  Importar
                </button>
              </div>
            </div>

            {/* Fallback Inteligente caso o LinkedIn exija login (AuthWall) */}
            {showTextFallback && (
              <div className="p-5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-900">
                      Importação Assistida de Perfil LinkedIn (100% à prova de bloqueios)
                    </h4>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Como o LinkedIn protege perfis com login privado, você tem duas opções simples:
                      <br />
                      <strong>1.</strong> Salve seu perfil em PDF no LinkedIn (botão <em>Mais → Salvar como PDF</em>) e suba na aba anterior.
                      <br />
                      <strong>2.</strong> Ou copie o texto das suas seções de <em>Experiência / Formação</em> e cole abaixo:
                    </p>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={rawLinkedInText}
                  onChange={(e) => setRawLinkedInText(e.target.value)}
                  placeholder="Cole aqui o texto copiado do seu perfil do LinkedIn (ex: Experiência, Residência, Formação)..."
                  className="w-full p-3 text-xs border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />

                <button
                  onClick={handleLinkedInImport}
                  disabled={isImportingLinkedIn || rawLinkedInText.trim().length < 10}
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-300 text-white font-medium px-4 py-2 rounded-lg text-xs transition-all shadow-sm"
                >
                  {isImportingLinkedIn ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileCheck2 className="w-3.5 h-3.5" />
                  )}
                  Processar Texto com o Jev
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista de Documentos Processados */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Documentos e Fontes Cadastradas ({documents.length})
          </h2>
          <span className="text-xs text-slate-400">Integridade SHA-256</span>
        </div>

        {documents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Nenhum documento ou link importado até o momento.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 truncate">
                      {doc.original_name}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                      {doc.source_type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 truncate font-mono">
                    SHA-256: {doc.sha256}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {doc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
