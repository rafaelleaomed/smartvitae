-- Migration 002: Políticas de Segurança em Nível de Linha (Row Level Security - RLS)
-- Garante isolamento criptográfico e de autorização absoluto entre usuários

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para 'profiles'
CREATE POLICY "Users can view own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = user_id);

-- 3. Políticas para 'consents'
CREATE POLICY "Users can view own consents" 
    ON consents FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents" 
    ON consents FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 4. Políticas para 'documents'
CREATE POLICY "Users can view own documents" 
    ON documents FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" 
    ON documents FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" 
    ON documents FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" 
    ON documents FOR DELETE 
    USING (auth.uid() = user_id);

-- 5. Políticas para 'evidence_items'
CREATE POLICY "Users can view own evidence items" 
    ON evidence_items FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evidence items" 
    ON evidence_items FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own evidence items" 
    ON evidence_items FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own evidence items" 
    ON evidence_items FOR DELETE 
    USING (auth.uid() = user_id);

-- 6. Políticas para 'ai_audit_logs'
CREATE POLICY "Users can view own audit logs" 
    ON ai_audit_logs FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs" 
    ON ai_audit_logs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
