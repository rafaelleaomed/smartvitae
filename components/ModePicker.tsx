"use client";

import { useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Target,
  FileEdit,
  CheckCircle2,
  TrendingUp,
  Zap,
  Award,
} from "lucide-react";

export type AppMode = "update" | "match" | null;

interface ModePickerProps {
  onSelect: (mode: AppMode) => void;
}

export function ModePicker({ onSelect }: ModePickerProps) {
  const [hovered, setHovered] = useState<AppMode>(null);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Currículo inteligente, sem invenções
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          O que você quer fazer{" "}
          <span className="text-blue-600">hoje?</span>
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          O SmartVitae trabalha apenas com fatos reais do seu histórico.
          Sem fabricação, sem risco para sua reputação.
        </p>
      </div>

      {/* Cards de Seleção */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
        {/* Card 1: Atualizar Currículo */}
        <button
          type="button"
          onClick={() => onSelect("update")}
          onMouseEnter={() => setHovered("update")}
          onMouseLeave={() => setHovered(null)}
          className={`group relative text-left rounded-2xl border-2 p-6 sm:p-8 cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            hovered === "update"
              ? "border-blue-500 bg-blue-50/60 shadow-lg shadow-blue-100 -translate-y-1"
              : "border-slate-200 bg-white hover:border-blue-400 hover:shadow-md"
          }`}
        >
          {/* Ícone */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors ${
              hovered === "update" ? "bg-blue-600" : "bg-slate-100"
            }`}
          >
            <FileEdit
              className={`w-6 h-6 transition-colors ${
                hovered === "update" ? "text-white" : "text-slate-600"
              }`}
            />
          </div>

          {/* Texto */}
          <div className="space-y-2 mb-6">
            <h2 className="text-lg font-extrabold text-slate-900">
              Turbinar meu Currículo
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Adicione novos certificados, experiências ou vincule seu LinkedIn. 
              O SmartVitae organiza tudo na sua base de evidências.
            </p>
          </div>

          {/* Bullets */}
          <ul className="space-y-1.5 mb-6">
            {[
              "Importe certificados em PDF",
              "Conecte seu perfil do LinkedIn",
              "Organize por área de atuação",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-[11px] text-slate-600">
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    hovered === "update" ? "text-blue-500" : "text-slate-400"
                  }`}
                />
                {item}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${
              hovered === "update" ? "text-blue-700" : "text-slate-600 group-hover:text-blue-700"
            }`}
          >
            Atualizar agora
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>

          {/* Selo de destaque */}
          <div
            className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              hovered === "update"
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            <Award className="w-3 h-3 inline-block mr-0.5 -mt-0.5" />
            Base Factual
          </div>
        </button>

        {/* Card 2: Match com Vaga */}
        <button
          type="button"
          onClick={() => onSelect("match")}
          onMouseEnter={() => setHovered("match")}
          onMouseLeave={() => setHovered(null)}
          className={`group relative text-left rounded-2xl border-2 p-6 sm:p-8 cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
            hovered === "match"
              ? "border-emerald-500 bg-emerald-50/60 shadow-lg shadow-emerald-100 -translate-y-1"
              : "border-slate-200 bg-white hover:border-emerald-400 hover:shadow-md"
          }`}
        >
          {/* Ícone */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors ${
              hovered === "match" ? "bg-emerald-600" : "bg-slate-100"
            }`}
          >
            <Target
              className={`w-6 h-6 transition-colors ${
                hovered === "match" ? "text-white" : "text-slate-600"
              }`}
            />
          </div>

          {/* Texto */}
          <div className="space-y-2 mb-6">
            <h2 className="text-lg font-extrabold text-slate-900">
              Ver minha chance na vaga
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cole o link ou texto da vaga e descubra sua aderência real antes de
              enviar o currículo. Sem achismos.
            </p>
          </div>

          {/* Bullets */}
          <ul className="space-y-1.5 mb-6">
            {[
              "Análise real em 6 dimensões",
              "Veredito honesto: compatível ou não",
              "Currículo adaptado para a vaga",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-[11px] text-slate-600">
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    hovered === "match" ? "text-emerald-500" : "text-slate-400"
                  }`}
                />
                {item}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${
              hovered === "match" ? "text-emerald-700" : "text-slate-600 group-hover:text-emerald-700"
            }`}
          >
            Analisar vaga
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>

          {/* Selos */}
          <div
            className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              hovered === "match"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            <TrendingUp className="w-3 h-3 inline-block mr-0.5 -mt-0.5" />
            IA + JEV
          </div>
        </button>
      </div>

      {/* Rodapé de confiança */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 max-w-lg">
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-yellow-500" />
          Resposta em segundos
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          Zero alucinação
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-500" />
          Conformidade CFM
        </span>
      </div>
    </div>
  );
}
