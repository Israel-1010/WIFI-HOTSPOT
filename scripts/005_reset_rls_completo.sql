-- Remove TODAS as políticas RLS de TODAS as tabelas e recria políticas minimalistas
-- Este script resolve definitivamente o problema de recursão infinita

-- 1. DESABILITAR RLS em todas as tabelas temporariamente
ALTER TABLE IF EXISTS public.perfis DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.revendas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.planos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hotspots DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campanhas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.enquetes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.questoes_enquetes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.respostas_enquetes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gamificacao DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pontos_usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.logs_atividades DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.metricas_uso DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS as políticas existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 3. REABILITAR RLS em todas as tabelas
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questoes_enquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_enquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pontos_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_uso ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR políticas minimalistas SEM RECURSÃO
-- Estas políticas usam APENAS auth.uid() e não consultam outras tabelas

-- PERFIS: Usuários podem ver e editar apenas seu próprio perfil
CREATE POLICY "perfis_select_own" ON public.perfis
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "perfis_update_own" ON public.perfis
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "perfis_insert_own" ON public.perfis
    FOR INSERT WITH CHECK (auth.uid() = id);

-- REVENDAS: Todos podem ver revendas ativas (para white label)
CREATE POLICY "revendas_select_all" ON public.revendas
    FOR SELECT USING (true);

CREATE POLICY "revendas_insert_authenticated" ON public.revendas
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "revendas_update_authenticated" ON public.revendas
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- PLANOS: Todos podem ver planos
CREATE POLICY "planos_select_all" ON public.planos
    FOR SELECT USING (true);

-- HOTSPOTS: Usuários autenticados podem gerenciar
CREATE POLICY "hotspots_select_authenticated" ON public.hotspots
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "hotspots_insert_authenticated" ON public.hotspots
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "hotspots_update_authenticated" ON public.hotspots
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "hotspots_delete_authenticated" ON public.hotspots
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- CAMPANHAS: Usuários autenticados podem gerenciar
CREATE POLICY "campanhas_select_authenticated" ON public.campanhas
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "campanhas_insert_authenticated" ON public.campanhas
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "campanhas_update_authenticated" ON public.campanhas
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "campanhas_delete_authenticated" ON public.campanhas
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- VOUCHERS: Usuários autenticados podem gerenciar
CREATE POLICY "vouchers_select_authenticated" ON public.vouchers
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "vouchers_insert_authenticated" ON public.vouchers
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "vouchers_update_authenticated" ON public.vouchers
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "vouchers_delete_authenticated" ON public.vouchers
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ENQUETES: Usuários autenticados podem gerenciar
CREATE POLICY "enquetes_select_authenticated" ON public.enquetes
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "enquetes_insert_authenticated" ON public.enquetes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "enquetes_update_authenticated" ON public.enquetes
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "enquetes_delete_authenticated" ON public.enquetes
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- QUESTOES_ENQUETES: Usuários autenticados podem gerenciar
CREATE POLICY "questoes_enquetes_select_authenticated" ON public.questoes_enquetes
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "questoes_enquetes_insert_authenticated" ON public.questoes_enquetes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "questoes_enquetes_update_authenticated" ON public.questoes_enquetes
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "questoes_enquetes_delete_authenticated" ON public.questoes_enquetes
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- RESPOSTAS_ENQUETES: Usuários podem ver suas próprias respostas
CREATE POLICY "respostas_enquetes_select_own" ON public.respostas_enquetes
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "respostas_enquetes_insert_own" ON public.respostas_enquetes
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- GAMIFICACAO: Usuários autenticados podem ver
CREATE POLICY "gamificacao_select_authenticated" ON public.gamificacao
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "gamificacao_insert_authenticated" ON public.gamificacao
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "gamificacao_update_authenticated" ON public.gamificacao
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "gamificacao_delete_authenticated" ON public.gamificacao
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- PONTOS_USUARIOS: Usuários podem ver apenas seus próprios pontos
CREATE POLICY "pontos_usuarios_select_own" ON public.pontos_usuarios
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "pontos_usuarios_update_own" ON public.pontos_usuarios
    FOR UPDATE USING (auth.uid() = usuario_id);

-- LOGS_ATIVIDADES: Usuários autenticados podem ver logs
CREATE POLICY "logs_atividades_select_authenticated" ON public.logs_atividades
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "logs_atividades_insert_authenticated" ON public.logs_atividades
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- METRICAS_USO: Usuários autenticados podem ver métricas
CREATE POLICY "metricas_uso_select_authenticated" ON public.metricas_uso
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "metricas_uso_insert_authenticated" ON public.metricas_uso
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
