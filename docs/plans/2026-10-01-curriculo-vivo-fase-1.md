# Currículo Vivo - Plano de Implementação da Fase 1 (com Ingestão do LinkedIn)

> **For Agent:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Construir a Fase 1 funcional do "Currículo Vivo" com autenticação, banco de dados isolado via RLS, ingestão de documentos (PDFs, Lattes e link do perfil LinkedIn), motor de decisão Jev (TypeSafe AI) com fallback determinístico local e tela de revisão de evidências auditáveis.

**Architecture:** Aplicação Next.js (App Router, TypeScript) com arquitetura desacoplada via interfaces de provedores (DecisionProvider, ExtractionProvider). Banco de dados PostgreSQL (Supabase) com RLS estrito garantindo isolamento total por usuário. Motor de decisão de System One (Jev) para classificação tipada sem alucinação, integrado a regras determinísticas de conformidade médica (CFM/RQE).

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Lucide Icons, Supabase (Auth, Postgres, Storage), Zod, Vitest, unpdf/pdf-parse, TypeSafe AI (Jev System One API).

---

### Task 1: Inicialização do Repositório e Configuração do Next.js com Vitest

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.gitignore`, `.env.example`
- Test: `tests/setup.test.ts`

**Step 1: Inicializar Git e criar estrutura do projeto Next.js com TypeScript**
- Rodar inicialização do git.
- Configurar dependências essenciais: `next`, `react`, `react-dom`, `typescript`, `@types/node`, `@types/react`, `tailwindcss`, `postcss`, `autoprefixer`, `lucide-react`, `clsx`, `tailwind-merge`, `zod`, `vitest`, `@testing-library/react`.

**Step 2: Escrever teste de sanidade com Vitest**
- Criar `tests/setup.test.ts` verificando carregamento básico do ambiente.

**Step 3: Executar teste e validar**
- Rodar `npx vitest run` e validar sucesso.

**Step 4: Commit**
- Git commit: `chore: initial project setup with Next.js and Vitest`

---

### Task 2: Esquema do Banco de Dados Supabase, Migrações e Políticas RLS

**Files:**
- Create: `database/migrations/001_initial_schema.sql`
- Create: `database/migrations/002_rls_policies.sql`
- Create: `lib/db/supabase.ts`
- Create: `lib/db/types.ts`
- Test: `tests/db/schema.test.ts`

**Step 1: Escrever as migrações SQL com RLS estrito**
- Tabelas: `profiles`, `documents`, `evidence_items`, `ai_audit_logs`, `consents`.
- Políticas RLS: cada usuário só pode ler, inserir, atualizar e excluir seus próprios registros (`auth.uid() = user_id`).
- Índices: `user_id`, `sha256`, `evidence_type`, `review_status`.

**Step 2: Definir tipos TypeScript correspondentes e cliente Supabase tipado**
- Em `lib/db/types.ts` e `lib/db/supabase.ts`.

**Step 3: Testar validação dos schemas e integridade de tipos com Zod**
- Criar `tests/db/schema.test.ts` validando os modelos Zod de `Profile`, `Document`, `EvidenceItem`.

**Step 4: Commit**
- Git commit: `feat(db): add database schema, RLS policies and typescript contracts`

---

### Task 3: Serviço de Sanitização de Dados (LGPD & Sigilo Médico)

**Files:**
- Create: `lib/privacy/sanitizer.ts`
- Test: `tests/privacy/sanitizer.test.ts`

**Step 1: Escrever teste de falha para sanitização de PII**
- Testar remoção de CPF, RG, e-mail, telefone, endereços e menções sensíveis antes de qualquer envio a APIs de IA.

**Step 2: Implementar o sanitizador determinístico**
- Em `lib/privacy/sanitizer.ts`.

**Step 3: Executar testes**
- Validar aprovação em `tests/privacy/sanitizer.test.ts`.

**Step 4: Commit**
- Git commit: `feat(privacy): add PII data sanitization for LGPD and medical compliance`

---

### Task 4: Motor de Decisão Jev (TypeSafe AI) & Regras Locais com Fallback

**Files:**
- Create: `services/decisions/types.ts`
- Create: `services/decisions/local-provider.ts`
- Create: `services/decisions/jev-provider.ts`
- Create: `services/decisions/index.ts`
- Test: `tests/decisions/decision-provider.test.ts`

**Step 1: Definir contratos da interface DecisionProvider**
- `classifyCertificate(state: CertificateState): Promise<CertificateDecision>`
- `scoreEvidenceForJob(...)`

**Step 2: Implementar LocalRuleDecisionProvider (Regras CFM / RQE e Trava Médica)**
- Regras rígidas: se for curso livre, proibir promoção a especialidade ou residência médica.
- Identificação determinística de pós-graduação vs residência médica.

**Step 3: Implementar JevDecisionProvider**
- Integração com `POST https://api.typesafe.ai/v1/systemone` com primitives `choice`, `score`, `noul`.
- Thresholds: 0.90 (auto-apply), 0.75 (suggestion), < 0.75 (review obrigatório).
- Circuit breaker: caso a API da TypeSafe falhe ou não haja chave, ativação automática do `LocalRuleDecisionProvider`.

**Step 4: Testar classificação e regras de fallback**
- Validar em `tests/decisions/decision-provider.test.ts`.

**Step 5: Commit**
- Git commit: `feat(decisions): implement Jev Decision Provider and Local Rules fallback`

---

### Task 5: Extrator de Documentos (PDF Nativo) e Normalizador

**Files:**
- Create: `services/extraction/types.ts`
- Create: `services/extraction/pdf-extractor.ts`
- Create: `services/extraction/normalizer.ts`
- Test: `tests/extraction/pdf-extractor.test.ts`

**Step 1: Escrever teste para extração de texto de PDF e normalização de datas/horas**
- Validar identificação de páginas, contagem de caracteres e extração de metadados.

**Step 2: Implementar extração nativa de PDF e normalizador de evidências**
- `services/extraction/pdf-extractor.ts` e `services/extraction/normalizer.ts`.

**Step 3: Rodar testes**
- Executar e aprovar testes.

**Step 4: Commit**
- Git commit: `feat(extraction): add native PDF extractor and deterministic normalizer`

---

### Task 6: Módulo de Ingestão de LinkedIn para o Piloto

**Files:**
- Create: `services/extraction/linkedin-service.ts`
- Create: `app/api/documents/linkedin/route.ts`
- Test: `tests/extraction/linkedin-service.test.ts`

**Step 1: Escrever teste para o LinkedIn Ingestion Service**
- Validar parsing de URLs válidas do LinkedIn (`linkedin.com/in/...`).
- Validar modo de fallback assistido (caso o LinkedIn exija autenticação ou bloqueie via Cloudflare, aceita parsing do PDF oficial exportado do LinkedIn ou texto do perfil).

**Step 2: Implementar LinkedInService e Endpoint de Ingestão**
- Normaliza experiências, formações, licenças e cursos obtidos via perfil.
- Gera evidências rastreadas com `source_type: 'linkedin'`.

**Step 3: Rodar testes**
- Executar e aprovar testes em `tests/extraction/linkedin-service.test.ts`.

**Step 4: Commit**
- Git commit: `feat(linkedin): implement LinkedIn profile link ingestion and fallback parser`

---

### Task 7: Rotas de API da Fase 1 (Upload, Processamento e Evidências)

**Files:**
- Create: `app/api/documents/upload/route.ts`
- Create: `app/api/documents/[id]/process/route.ts`
- Create: `app/api/evidence/route.ts`
- Create: `app/api/evidence/[id]/approve/route.ts`
- Create: `app/api/evidence/[id]/reject/route.ts`
- Test: `tests/api/documents-api.test.ts`

**Step 1: Implementar rotas com validação Zod e proteção de sessão**
- Validação de MIME types permitidos (PDF, DOCX, imagens).
- Cálculo de hash SHA-256 para detecção de duplicidades.
- Orquestração: Upload -> Extração -> Sanitização -> Classificação Jev -> Persistência de Evidências.

**Step 2: Testar fluxo de API completo**
- Validar em `tests/api/documents-api.test.ts`.

**Step 3: Commit**
- Git commit: `feat(api): create upload, processing and evidence management endpoints`

---

### Task 8: Interface do Usuário (UI/UX) - Dashboard, Upload & LinkedIn e Tela de Evidências

**Files:**
- Create: `app/layout.tsx`, `app/page.tsx`
- Create: `app/documentos/page.tsx`
- Create: `app/evidencias/page.tsx`
- Create: `components/documents/UploadZone.tsx`
- Create: `components/documents/LinkedInImportModal.tsx`
- Create: `components/evidence/EvidenceTable.tsx`
- Create: `components/evidence/EvidenceCard.tsx`
- Create: `components/ui/*` (Button, Input, Badge, Card, Dialog, Toast)

**Step 1: Criar componentes base de UI no padrão shadcn/ui**
- Componentes acessíveis, responsivos e profissionais em Tailwind CSS.

**Step 2: Construir tela de Ingestão com abas (Upload de Arquivos + Link LinkedIn)**
- Permite subir PDFs de certificados/Lattes ou colar link do LinkedIn.
- Indicador visual de progresso e detecção de duplicidade.

**Step 3: Construir tela de Base de Evidências**
- Exibe itens classificados pelo Jev com nível de confiança (badge verde para auto-aprovado, amarelo para sugestão, vermelho para pendente de revisão).
- Modal de comparação mostrando o trecho original extraído versus a evidência estruturada.
- Ações: Aprovar, Editar, Rejeitar e Bloquear edição automática.

**Step 4: Validar build e integridade de tipos**
- Rodar `npx tsc --noEmit` e `npm run build`.

**Step 5: Commit**
- Git commit: `feat(ui): complete Phase 1 user interface for documents and evidence review`
