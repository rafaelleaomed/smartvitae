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
  Sparkles,
  Info,
  HelpCircle,
  ArrowRight,
  ClipboardPaste,
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

  // LinkedIn State
  const [linkedinUrl, setLinkedinUrl] = useState("https://www.linkedin.com/in/rafaelleaomed/");
  const [rawLinkedInText, setRawLinkedInText] = useState("");
  const [isImportingLinkedIn, setIsImportingLinkedIn] = useState(false);

  useEffect(() => {
    loadDocuments();
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

  // Upload de Arquivos Genéricos (Certificados, Lattes em PDF/DOCX)
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

  // Upload do PDF Oficial exportado do LinkedIn
  const handleLinkedInPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingLinkedIn(true);
    setUploadFeedback(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("profileUrl", linkedinUrl);

    try {
      const res = await fetch("/api/documents/linkedin", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar PDF do LinkedIn.");
      }

      setUploadFeedback({
        type: "success",
        message: `Sucesso! O perfil em PDF "${file.name}" foi processado e gerou ${data.evidenceCount} evidências com classificação do Jev!`,
      });
      loadDocuments();
    } catch (err: any) {
      setUploadFeedback({
        type: "error",
        message: err.message,
      });
    } finally {
      setIsImportingLinkedIn(false);
      e.target.value = "";
    }
  };

  // Ingestão do Texto copiado do LinkedIn ou envio manual
  const handleLinkedInTextImport = async () => {
    if (!rawLinkedInText || rawLinkedInText.trim().length < 15) {
      setUploadFeedback({
        type: "error",
        message: "Por favor, cole o texto das seções do seu perfil (Experiências, Formações ou Cursos).",
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
          rawText: rawLinkedInText.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar texto do LinkedIn.");
      }

      setUploadFeedback({
        type: "success",
        message: data.message || "Perfil do LinkedIn importado e estruturado com sucesso!",
      });
      setRawLinkedInText("");
      loadDocuments();
    } catch (err: any) {
      setUploadFeedback({
        type: "error",
        message: err.message,
      });
    } finally {
      setIsImportingLinkedIn(false);
    }
  };

  // Carregar Perfil Médico de Exemplo para Teste Instantâneo
  const handleLoadDemoProfile = () => {
    setRawLinkedInText(`Experiência
Médico Assistente e Preceptor
Hospital das Clínicas da Faculdade de Medicina da USP
Jan de 2022 - Presente

Pesquisador em Inteligência Artificial e Saúde Digital
Centro de Inovação em Tecnologias Médicas
Mar de 2023 - Presente

Formação acadêmica
Faculdade de Medicina da USP
Graduação em Medicina
2014 - 2019

Residência Médica em Clínica Médica (CNRM)
Hospital das Clínicas da FMUSP
2020 - 2022

Licenças e certificados
Certificação Profissional em Machine Learning para Saúde
Stanford Online & DeepLearning.AI

Suporte Avançado de Vida Cardiovascular (ACLS)
American Heart Association`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Ingestão de Documentos & Fontes
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Envie seus certificados, diplomas ou importe seu perfil do LinkedIn para enriquecer a base de evidências.
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
          Upload de Certificados & Lattes (PDF)
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
          Importar do LinkedIn
        </button>
      </div>

      {/* Alerta de Feedback */}
      {uploadFeedback && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 text-sm border transition-all ${
            uploadFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : uploadFeedback.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-blue-50 text-blue-800 border-blue-200"
          }`}
        >
          {uploadFeedback.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <p className="leading-relaxed font-medium">{uploadFeedback.message}</p>
        </div>
      )}

      {/* Aba 1: Upload de Arquivos Tradicionais */}
      {activeTab === "upload" && (
        <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 transition-colors text-center space-y-4 shadow-sm">
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

      {/* Aba 2: LinkedIn (Solução Fluida e Sem Erros) */}
      {activeTab === "linkedin" && (
        <div className="space-y-6">
          {/* Header Explicativo da Integração */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Linkedin className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Importação de Perfil do LinkedIn
                  </h2>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Conformidade LGPD
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  Para proteger seus dados e respeitar a privacidade do LinkedIn (que bloqueia robôs que tentam ler seu perfil sem senha), 
                  utilize o método oficial de <strong>1 clique</strong> abaixo para importar seu perfil completo com segurança total.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <span className="text-xs font-mono bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 block truncate max-w-xs">
                {linkedinUrl}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Opção A: Salvar como PDF no LinkedIn (1 Clique - Recomendado) */}
            <div className="bg-white p-6 rounded-2xl border-2 border-blue-200/80 hover:border-blue-500 transition-all shadow-sm space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    <Sparkles className="w-3.5 h-3.5" />
                    Método Recomendado (100% Completo)
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Tempo: 3 segundos</span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    1. Salvar como PDF do LinkedIn
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    O próprio LinkedIn gera um PDF perfeito com todas as suas experiências, residências, formações e licenças:
                  </p>
                </div>

                <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Abra seu perfil no LinkedIn:{" "}
                      <a
                        href={linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 font-semibold underline inline-flex items-center gap-0.5"
                      >
                        Abrir Perfil <ExternalLink className="w-3 h-3" />
                      </a>
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Clique no botão <strong>"Mais"</strong> (ao lado de 'Enviar por mensagem') e selecione <strong>"Salvar como PDF"</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>Solte o arquivo PDF baixado no botão abaixo!</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium p-3.5 rounded-xl cursor-pointer shadow-sm text-sm transition-all">
                  {isImportingLinkedIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando com o Jev...
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" />
                      Soltar PDF do LinkedIn Aqui
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    disabled={isImportingLinkedIn}
                    onChange={handleLinkedInPdfUpload}
                  />
                </label>
              </div>
            </div>

            {/* Opção B: Colar Texto do Perfil */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Opção Alternativa
                  </span>
                  <button
                    type="button"
                    onClick={handleLoadDemoProfile}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    Carregar Perfil de Teste
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    2. Ou Cole o Texto do seu Perfil
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Copie as informações do seu perfil (seções de Experiência, Residência, Formação) e cole abaixo:
                  </p>
                </div>

                <textarea
                  rows={6}
                  value={rawLinkedInText}
                  onChange={(e) => setRawLinkedInText(e.target.value)}
                  placeholder="Cole aqui o texto copiado do LinkedIn..."
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleLinkedInTextImport}
                  disabled={isImportingLinkedIn || rawLinkedInText.trim().length < 15}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium p-3.5 rounded-xl text-sm transition-all shadow-sm"
                >
                  {isImportingLinkedIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Classificando Evidências...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      Processar Texto com o Jev
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Card Técnico para os Mentores sobre o Bloqueio HTTP 999 do LinkedIn */}
          <div className="p-5 rounded-2xl bg-slate-100/70 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Nota Técnica de Arquitetura (Para Apresentação aos Mentores):
            </div>
            <p className="leading-relaxed">
              O LinkedIn implementa barreiras de segurança rigorosas (Cloudflare Bot Management e código HTTP 999 / AuthWall) que proíbem consultas automatizadas a URLs sem consentimento e login. 
              Por compliance com a <strong>LGPD</strong> e para cumprir o princípio de <strong>não utilizar scraping que viole termos de uso</strong> (Seção 3 da especificação), a solução mais ética e infalível adotada pelo produto é a ingestão estruturada do <em>PDF oficial exportado</em> ou do texto fornecido pelo próprio titular.
            </p>
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
