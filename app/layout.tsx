import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { ShieldCheck, FileText, Database, Sparkles, UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "NexoVitae | Inteligência Curricular com JEV para Médicos",
  description: "NexoVitae — Base de Evidências Profissionais e Adequação Curricular sem Alucinação para Médicos e Inovadores em Saúde.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col font-sans">
        {/* Header Superior Profissional */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white flex items-center justify-center shrink-0">
                <img
                  src="/nexovitae-logo.jpg"
                  alt="NexoVitae Logo"
                  className="w-full h-full object-cover scale-110"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                    NexoVitae
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                    JEV Powered
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Adequação Curricular sem Alucinação • CFM & RQE
                </p>
              </div>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
              >
                Início (2 Passos)
              </Link>
              <Link
                href="/documentos"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                Certificados & LinkedIn
              </Link>
              <Link
                href="/evidencias"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <Database className="w-4 h-4" />
                Base de Evidências
              </Link>
            </nav>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1 justify-end">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Dr. Lucas Carvalho
                </div>
                <div className="text-[11px] text-slate-500">CRM 123456-SP • RQE 65432</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-200">
                LC
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Rodapé com Conformidade Ética e LGPD */}
        <footer className="border-t border-slate-200 bg-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>
                Motor de Decisão: <strong>Jev System One</strong> (TypeSafe AI) + Regras CFM / RQE
              </span>
            </div>
            <div>
              Conformidade com LGPD (Lei 13.709/2018) & Resoluções CFM 2.336/2023. Proibida invenção de dados.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
