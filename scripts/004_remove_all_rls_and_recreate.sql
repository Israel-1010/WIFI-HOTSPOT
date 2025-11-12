-- Remove TODAS as políticas RLS existentes e cria políticas minimalistas sem recursão
-- Este script resolve o problema de "infinite recursion detected in policy"

-- Desabilitar RLS temporariamente para fazer limpeza
ALTER TABLE IF EXISTS perfis DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS campanhas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS enquetes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS questoes_enquetes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS respostas_enquetes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gamificacao DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pontos_usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS logs_atividades DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS revendas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS planos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hotspots DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS metricas_uso DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Remover funções antigas que podem causar problemas
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS user_has_role(text) CASCADE;

-- Criar função simples para verificar role SEM causar recursão
-- Usa SECURITY DEFINER para executar com privilégios do owner
CREATE OR REPLACE FUNCTION public.get_user_role_safe()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    user_role text;
BEGIN
    -- Busca o role diretamente sem políticas RLS
    SELECT role INTO user_role
    FROM public.perfis
    WHERE id = auth.uid();
    
    RETURN COALESCE(user_role, 'cliente');
END;
$$;

-- Reabilitar RLS
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questoes_enquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_enquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE revendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_uso ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA PERFIS (SEM RECURSÃO!)
-- ============================================

-- Usuários podem ver e editar seu próprio perfil
CREATE POLICY "perfis_select_own" ON perfis
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "perfis_update_own" ON perfis
    FOR UPDATE USING (auth.uid() = id);

-- Permitir INSERT para novos usuários (trigger cria automaticamente)
CREATE POLICY "perfis_insert_own" ON perfis
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin geral pode ver todos os perfis
CREATE POLICY "perfis_select_admin_geral" ON perfis
    FOR SELECT USING (get_user_role_safe() = 'admin_geral');

-- Admin geral pode atualizar todos os perfis
CREATE POLICY "perfis_update_admin_geral" ON perfis
    FOR UPDATE USING (get_user_role_safe() = 'admin_geral');

-- Admin revenda pode ver perfis da sua revenda
CREATE POLICY "perfis_select_admin_revenda" ON perfis
    FOR SELECT USING (
        get_user_role_safe() = 'admin_revenda' 
        AND revenda_id = (SELECT revenda_id FROM perfis WHERE id = auth.uid())
    );

-- ============================================
-- POLÍTICAS PARA REVENDAS
-- ============================================

-- Admin geral pode fazer tudo
CREATE POLICY "revendas_all_admin_geral" ON revendas
    FOR ALL USING (get_user_role_safe() = 'admin_geral');

-- Admin revenda pode ver sua própria revenda
CREATE POLICY "revendas_select_own" ON revendas
    FOR SELECT USING (
        id = (SELECT revenda_id FROM perfis WHERE id = auth.uid())
    );

-- Admin revenda pode atualizar sua própria revenda
CREATE POLICY "revendas_update_own" ON revendas
    FOR UPDATE USING (
        get_user_role_safe() = 'admin_revenda'
        AND id = (SELECT revenda_id FROM perfis WHERE id = auth.uid())
    );

-- ============================================
-- POLÍTICAS PARA CAMPANHAS
-- ============================================

-- Usuários podem ver campanhas da sua revenda
CREATE POLICY "campanhas_select" ON campanhas
    FOR SELECT USING (
        revenda_id = (SELECT revenda_id FROM perfis WHERE id = auth.uid())
    );

-- Admin revenda e admin geral podem inserir
CREATE POLICY "campanhas_insert" ON campanhas
    FOR INSERT WITH CHECK (
        get_user_role_safe() IN ('admin_revenda', 'admin_geral')
        AND revenda_id = (SELECT revenda_id FROM perfis WHERE id = auth.uid())
    );

-- Admin revenda e admin geral podem atualizar
CREATE POLICY "campanhas_update" ON campanhas
    FOR UPDATE USING (
        get_user_role_safe() IN ('admin_revenda', 'admin_geral')
        AND revenda_id = (SELECT revenda_id FROM perfis WHERE id = auth.uid())
    );

-- Admin revenda e admin geral podem deletar
CREATE POLICY "campanhas_delete" ON campanhas
    FOR DELETE USING (
        get_user_role_safe() IN ('admin_revenda', 'admin_geral')
        AND revenda_id = (SELECT revenda_id FROM perfis WHERE id = auth.uid())
    );

-- ============================================
-- POLÍTICAS PARA VOUCHERS
-- ============================================

CREATE POLICY "vouchers_select" ON vouchers
    FOR SELECT USING (
        revenda_id = (SELECT revenda_id FROM perfis WHERE id = auth.uid())
    );

CREATE POLICY "vouchers_insert" ON vouchers
    FOR INSERT WITH CHECK (
        get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

CREATE POLICY "vouchers_update" ON vouchers
    FOR UPDATE USING (
        get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

CREATE POLICY "vouchers_delete" ON vouchers
    FOR DELETE USING (
        get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

-- ============================================
-- POLÍTICAS PARA ENQUETES
-- ============================================

CREATE POLICY "enquetes_select" ON enquetes
    FOR SELECT USING (
        revenda_id = (SELECT revenda_id FROM perfis WHERE id = auth.uid())
    );

CREATE POLICY "enquetes_insert" ON enquetes
    FOR INSERT WITH CHECK (
        get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

CREATE POLICY "enquetes_update" ON enquetes
    FOR UPDATE USING (
        get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

CREATE POLICY "enquetes_delete" ON enquetes
    FOR DELETE USING (
        get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

-- ============================================
-- POLÍTICAS PARA QUESTÕES DE ENQUETES
-- ============================================

CREATE POLICY "questoes_enquetes_select" ON questoes_enquetes
    FOR SELECT USING (true);

CREATE POLICY "questoes_enquetes_insert" ON questoes_enquetes
    FOR INSERT WITH CHECK (
        get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

CREATE POLICY "questoes_enquetes_update" ON questoes_enquetes
    FOR UPDATE USING (
        get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

CREATE POLICY "questoes_enquetes_delete" ON questoes_enquetes
    FOR DELETE USING (
        get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

-- ============================================
-- POLÍTICAS PARA RESPOSTAS DE ENQUETES
-- ============================================

CREATE POLICY "respostas_enquetes_select" ON respostas_enquetes
    FOR SELECT USING (
        usuario_id = auth.uid() 
        OR get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

CREATE POLICY "respostas_enquetes_insert" ON respostas_enquetes
    FOR INSERT WITH CHECK (usuario_id = auth.uid());

-- ============================================
-- POLÍTICAS PARA GAMIFICAÇÃO
-- ============================================

CREATE POLICY "gamificacao_select" ON gamificacao
    FOR SELECT USING (
        revenda_id = (SELECT revenda_id FROM perfis WHERE id = auth.uid())
    );

CREATE POLICY "gamificacao_insert" ON gamificacao
    FOR INSERT WITH CHECK (
        get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

CREATE POLICY "gamificacao_update" ON gamificacao
    FOR UPDATE USING (
        get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

CREATE POLICY "gamificacao_delete" ON gamificacao
    FOR DELETE USING (
        get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

-- ============================================
-- POLÍTICAS PARA PONTOS DE USUÁRIOS
-- ============================================

CREATE POLICY "pontos_usuarios_select" ON pontos_usuarios
    FOR SELECT USING (
        usuario_id = auth.uid()
        OR get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

CREATE POLICY "pontos_usuarios_insert" ON pontos_usuarios
    FOR INSERT WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "pontos_usuarios_update" ON pontos_usuarios
    FOR UPDATE USING (true);

-- ============================================
-- POLÍTICAS PARA LOGS DE ATIVIDADES
-- ============================================

CREATE POLICY "logs_atividades_select" ON logs_atividades
    FOR SELECT USING (
        usuario_id = auth.uid()
        OR get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

CREATE POLICY "logs_atividades_insert" ON logs_atividades
    FOR INSERT WITH CHECK (true);

-- ============================================
-- POLÍTICAS PARA PLANOS
-- ============================================

CREATE POLICY "planos_select" ON planos
    FOR SELECT USING (true);

CREATE POLICY "planos_all_admin_geral" ON planos
    FOR ALL USING (get_user_role_safe() = 'admin_geral');

-- ============================================
-- POLÍTICAS PARA HOTSPOTS
-- ============================================

CREATE POLICY "hotspots_select" ON hotspots
    FOR SELECT USING (
        cliente_id = auth.uid()
        OR get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

CREATE POLICY "hotspots_insert" ON hotspots
    FOR INSERT WITH CHECK (
        cliente_id = auth.uid()
        OR get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

CREATE POLICY "hotspots_update" ON hotspots
    FOR UPDATE USING (
        cliente_id = auth.uid()
        OR get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

CREATE POLICY "hotspots_delete" ON hotspots
    FOR DELETE USING (
        cliente_id = auth.uid()
        OR get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

-- ============================================
-- POLÍTICAS PARA MÉTRICAS DE USO
-- ============================================

CREATE POLICY "metricas_uso_select" ON metricas_uso
    FOR SELECT USING (
        get_user_role_safe() IN ('admin_revenda', 'admin_geral')
    );

CREATE POLICY "metricas_uso_insert" ON metricas_uso
    FOR INSERT WITH CHECK (true);

-- Conceder permissões necessárias
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role_safe() TO authenticated, anon;
