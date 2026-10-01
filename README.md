# Currículo Vivo — Piloto v1.0 (Comunidade Médicos Híbridos)

> **Base de Evidências Profissionais Auditável com Motor de Decisão Jev (TypeSafe AI / System One) e Compliance Ético CFM.**

Aplicação web desenvolvida para transformar documentos dispersos (certificados, diplomas, Lattes e links de perfil do LinkedIn) em uma base de evidências curriculares auditável, garantindo **zero alucinação** e conformidade estrita com as resoluções do CFM sobre publicidade médica e divulgação de especialidades (RQE).

---

## 🌟 Principais Diferenciais

1. **Ativo Central é a Base de Evidências:** Nenhuma frase entra no currículo sem um `evidence_id` e um trecho auditável (*grounding* documental).
2. **Motor de Decisão Jev (TypeSafe AI - System One):**  
   Classificação ultrarrápida, de baixo custo e tipada (`choice`, `score`, `noul`) do tipo de evidência, seção curricular e grau de incerteza, com fallback automático para regras locais determinísticas.
3. **Ingestão Nativa por Link do LinkedIn (Novo no Piloto):**  
   Permite importar diretamente o perfil do LinkedIn via URL ou extração assistida de texto/PDF oficial de 1 clique, decompondo experiências e formações em evidências.
4. **Travas Éticas CFM (Resolução CFM 2.336/2023):**  
   Bloqueio contra a autodenominação indevida de "especialista" sem RQE cadastrado e distinção rigorosa entre especialidades, pós-graduações *lato sensu* e cursos livres.
5. **Conformidade LGPD:**  
   Higienização e remoção de CPF, RG, contatos e dados clínicos de pacientes antes de qualquer comunicação com APIs externas de IA.

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- Node.js 18+ (testado no Node.js v24)
- npm ou pnpm

### 2. Clonar e Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```
> **Nota para o Piloto:** A aplicação possui modo de demonstração autônomo com persistência local em memória e provedor de regras determinísticas. Você pode testar imediatamente mesmo antes de configurar chaves do Supabase ou TypeSafe AI!

### 4. Executar em Modo de Desenvolvimento
```bash
npm run dev
```
Abra no navegador em [http://localhost:3000](http://localhost:3000).

### 5. Executar os Testes Automatizados
```bash
npm test
```

---

## 📐 Arquitetura do Sistema

```text
Browser / Usuário
  ├── Upload de Arquivos (PDFs nativos, Lattes, DOCX)
  └── Link do Perfil LinkedIn (https://linkedin.com/in/...)
        │
        ▼
Next.js App Router (Server-side)
  ├── 1. Extração de Texto Nativo (unpdf) / Parser LinkedIn
  ├── 2. Sanitizador PII (Remoção de CPF, RG e dados sensíveis)
  ├── 3. Normalizador Determinístico (datas, horas, credenciais)
  ├── 4. Motor de Decisão Jev (TypeSafe AI System One)
  │      └── Fallback: LocalRuleDecisionProvider (Regras CFM / MEC)
  └── 5. Repositório / Base de Evidências (PostgreSQL + RLS / Store)
        │
        ▼
Interface de Validação Humana (Dashboard & Gerenciador)
  ├── Trava de Segurança Humana (user_locked)
  └── Visualização de Origem (Grounding)
```

---

## 🗄️ Estrutura de Pastas

```text
app/
  ├── layout.tsx                   # Layout global com identidade Médicos Híbridos
  ├── page.tsx                     # Dashboard com métricas do piloto
  ├── documentos/page.tsx          # Upload de certificados e Ingestão do LinkedIn
  ├── evidencias/page.tsx          # Gestão da Base de Evidências com grounding
  └── api/
      ├── documents/upload/        # Endpoint de upload e processamento de arquivos
      ├── documents/linkedin/      # Endpoint de ingestão do LinkedIn
      └── evidence/                # Endpoints de consulta, aprovação e trava
database/
  └── migrations/
      ├── 001_initial_schema.sql   # Tabelas (profiles, documents, evidence_items, etc.)
      └── 002_rls_policies.sql     # Políticas RLS (Row Level Security)
lib/
  ├── db/types.ts                  # Schemas Zod e tipos TypeScript
  ├── db/store.ts                  # Repositório com seed médico para testes
  └── privacy/sanitizer.ts         # Sanitizador LGPD e médico
services/
  ├── decisions/                   # JevDecisionProvider & LocalRuleDecisionProvider
  └── extraction/                  # Extrator PDF nativo e LinkedInService
tests/                             # Testes unitários e de integração (Vitest)
```

---

## 🩺 Licença e Uso
Desenvolvido para uso exclusivo no programa piloto da comunidade **Médicos Híbridos**.
Proibida a remoção de mecanismos de rastreabilidade ou violação de diretrizes do CFM.
