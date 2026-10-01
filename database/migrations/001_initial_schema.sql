-- Migration 001: Schema inicial do Currículo Vivo
-- Habilita UUID e extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (Perfil do usuário)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    target_country VARCHAR(10) DEFAULT 'BR',
    preferred_language VARCHAR(10) DEFAULT 'pt-BR',
    professional_area TEXT,
    career_goal TEXT,
    crm_number TEXT,
    crm_state VARCHAR(2),
    rqe_numbers TEXT[], -- Registros de Qualificação de Especialista (CFM)
    linkedin_url TEXT,
    portfolio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Consents (Consentimento e LGPD)
CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    consent_version VARCHAR(20) NOT NULL,
    terms_accepted BOOLEAN NOT NULL DEFAULT TRUE,
    data_processing_accepted BOOLEAN NOT NULL DEFAULT TRUE,
    ai_processing_accepted BOOLEAN NOT NULL DEFAULT TRUE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Documents (Documentos enviados pelo usuário ou fontes como LinkedIn)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    source_type VARCHAR(50) DEFAULT 'upload', -- upload, linkedin, lattes
    storage_path TEXT,
    original_name TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    sha256 CHAR(64) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'uploaded', -- uploaded, extracting, extracted, review, failed, deleted
    extraction_provider VARCHAR(50),
    extraction_version VARCHAR(20),
    page_count INT DEFAULT 1,
    raw_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_document_sha UNIQUE(user_id, sha256)
);

-- 4. Evidence Items (Base de Evidências Profissionais - O Coração do Produto)
CREATE TABLE IF NOT EXISTS evidence_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL, 
    -- graduacao, pos_graduacao, residencia, mestrado, doutorado, titulo_especialista, 
    -- registro_profissional, certificacao_profissional, curso_aperfeicoamento, curso_livre, 
    -- evento, publicacao, ensino, projeto, experiencia, voluntariado, idioma, outro, nao_identificado
    resume_section VARCHAR(50) NOT NULL,
    -- formacao, experiencia, certificacoes, cursos, pesquisa_publicacoes, ensino, projetos, idiomas, voluntariado, omitir, revisao_humana
    title TEXT NOT NULL,
    issuer_or_organization TEXT,
    start_date VARCHAR(20),
    end_date VARCHAR(20),
    issue_date VARCHAR(20),
    expiry_date VARCHAR(20),
    workload_hours INT,
    credential_id TEXT,
    description TEXT,
    domain TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    source_pages JSONB DEFAULT '[]'::jsonb,
    source_excerpt TEXT,
    classification_source VARCHAR(30) DEFAULT 'jev', -- rule, jev, llm, user
    confidence NUMERIC(4,3) DEFAULT 1.000,
    career_signal INT DEFAULT 3, -- 1 a 5
    review_status VARCHAR(30) DEFAULT 'pending', -- pending, approved, corrected, rejected
    user_locked BOOLEAN DEFAULT FALSE, -- Trava: automações NUNCA alteram dados travados pelo usuário
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AI Audit Logs (Auditoria de IA - sem expor dados pessoais completos)
CREATE TABLE IF NOT EXISTS ai_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    operation VARCHAR(50) NOT NULL, -- classify_certificate, score_job_evidence, compose_resume, verify_resume
    provider VARCHAR(50) NOT NULL,  -- typesafe_jev, gemini, openai, local_rule
    model VARCHAR(50) NOT NULL,
    input_hash CHAR(64) NOT NULL,
    prompt_version VARCHAR(20),
    output_json JSONB,
    confidence NUMERIC(4,3),
    latency_ms INT,
    estimated_cost NUMERIC(8,6),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices essenciais para consultas velozes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_sha256 ON documents(sha256);
CREATE INDEX IF NOT EXISTS idx_evidence_user_id ON evidence_items(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence_items(evidence_type);
CREATE INDEX IF NOT EXISTS idx_evidence_review_status ON evidence_items(review_status);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_user_op ON ai_audit_logs(user_id, operation);
