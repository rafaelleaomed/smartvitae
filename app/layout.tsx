import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { ShieldCheck, FileText, Database, Sparkles, Home } from "lucide-react";
import { SmartVitaeLogo } from "@/components/SmartVitaeLogo";

export const metadata: Metadata = {
  title: "SmartVitae | Adequação Curricular sem Alucinação com JEV & Claude",
  description:
    "SmartVitae — Base de Evidências Profissionais e Adequação Curricular Factual sem Alucinação para Médicos e Inovadores em Saúde.",
  icons: {
    icon: "/smartvitae-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="overflow-x-hidden">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col font-sans overflow-x-hidden max-w-[100vw]">
        {/* Header Superior Clínico e Responsivo */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo SmartVitae */}
            <Link href="/" className="flex items-center group transition-transform hover:scale-[1.01]" aria-label="SmartVitae Início">
              <SmartVitaeLogo size="md" />
            </Link>

            {/* Menu Desktop */}
            <nav className="hidden md:flex items-center gap-1 sm:gap-1.5" aria-label="Navegação principal">
              <Link
                href="/"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition-colors"
              >
                Início (2 Passos)
              </Link>
              <Link
                href="/documentos"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Certificados & LinkedIn
              </Link>
              <Link
                href="/evidencias"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5 text-slate-500" />
                Base de Evidências
              </Link>
            </nav>

            {/* Ação Rápida no Topo */}
            <div className="flex items-center gap-2">
              <Link
                href="/evidencias"
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-right"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 justify-end">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Base de Evidências
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Somente Fatos Comprovados
                  </div>
                </div>
              </Link>

              {/* Botão Compacto Mobile */}
              <Link
                href="/evidencias"
                className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Evidências</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal com ritmo vertical balanceado */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-28 md:pb-16 overflow-x-hidden">
          {children}
        </main>

        {/* Barra de Navegação Inferior para Celulares */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg shadow-slate-900/5">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-bold text-slate-700 hover:text-blue-700 focus:text-blue-700 transition-colors"
          >
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>Início</span>
          </Link>

          <Link
            href="/documentos"
            className="flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-bold text-slate-700 hover:text-blue-700 focus:text-blue-700 transition-colors"
          >
            <FileText className="w-5 h-5 text-slate-500" />
            <span>Documentos</span>
          </Link>

          <Link
            href="/evidencias"
            className="flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-bold text-slate-700 hover:text-blue-700 focus:text-blue-700 transition-colors"
          >
            <Database className="w-5 h-5 text-slate-500" />
            <span>Evidências</span>
          </Link>
        </nav>

        {/* Rodapé com Conformidade Ética e LGPD */}
        <footer className="border-t border-slate-200 bg-white py-6 mb-14 md:mb-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                SmartVitae • Motor Duplo: <strong>JEV System One</strong> + <strong>Claude 3.5 Sonnet</strong>
              </span>
            </div>
            <div>
              Conformidade com LGPD (Lei 13.709/2018) & Resolução CFM 2.336/2023. Proibida invenção de dados.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
