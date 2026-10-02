import React from "react";

interface SmartVitaeLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function SmartVitaeLogo({
  className = "",
  size = "md",
  showText = true,
}: SmartVitaeLogoProps) {
  const iconDimensions = {
    sm: { w: 32, h: 32, textClass: "text-base", subClass: "text-[9px]" },
    md: { w: 40, h: 40, textClass: "text-lg", subClass: "text-[10px]" },
    lg: { w: 48, h: 48, textClass: "text-xl", subClass: "text-xs" },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {/* Ícone Vetorial com Iniciais SV e Alusão a Currículo */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-xl sm:rounded-2xl shadow-sm border border-blue-500/20 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-1.5 transition-transform group-hover:scale-105"
        style={{ width: iconDimensions.w, height: iconDimensions.h }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Base do Documento / Currículo com canto dobrado */}
          <rect
            x="7"
            y="6"
            width="34"
            height="36"
            rx="6"
            className="fill-blue-500/10 stroke-blue-400/40"
            strokeWidth="1.5"
          />
          {/* Canto dobrado do documento */}
          <path
            d="M33 6 L41 14 L33 14 Z"
            fill="url(#svDocFold)"
            opacity="0.9"
          />

          {/* Letra S estilizada como onda vital / sinapse */}
          <path
            d="M16 17 C16 14.5, 25 14.5, 25 18 C25 21.5, 17 21, 17 25 C17 29, 26 28.5, 26 26"
            stroke="url(#svGradS)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Letra V estilizada como check de validação factual */}
          <path
            d="M23 20 L27.5 32 L35 15"
            stroke="url(#svGradV)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Linhas indicativas de currículo / texto na base */}
          <line
            x1="12"
            y1="36"
            x2="22"
            y2="36"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.4"
          />
          <line
            x1="26"
            y1="36"
            x2="36"
            y2="36"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.4"
          />

          {/* Gradientes Definidos */}
          <defs>
            <linearGradient id="svGradS" x1="16" y1="15" x2="26" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#60a5fa" />
            </linearGradient>
            <linearGradient id="svGradV" x1="23" y1="15" x2="35" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60a5fa" />
              <stop offset="0.6" stopColor="#818cf8" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="svDocFold" x1="33" y1="6" x2="41" y2="14" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="1" stopColor="#1e3a8a" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Tipografia da Marca */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`font-black text-slate-900 tracking-tight transition-colors ${iconDimensions.textClass}`}
            >
              Smart<span className="text-blue-600">Vitae</span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 shrink-0">
              JEV
            </span>
          </div>
          <p
            className={`text-slate-500 font-medium hidden sm:block ${iconDimensions.subClass}`}
          >
            Adequação Curricular sem Alucinação • CFM & RQE
          </p>
        </div>
      )}
    </div>
  );
}

export default SmartVitaeLogo;
