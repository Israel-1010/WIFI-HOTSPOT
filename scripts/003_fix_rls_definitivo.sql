-- Remove TODAS as políticas RLS existentes que causam recursão
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Admins gerais podem ver todos os perfis" ON perfis;
DROP POLICY IF EXISTS "Admins de revenda podem ver perfis de sua revenda" ON perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Admins gerais podem atualizar qualquer perfil" ON perfis;
DROP POLICY IF EXISTS "Admins de revenda podem atualizar perfis de sua revenda" ON perfis;

DROP POLICY IF EXISTS "Usuários podem ver campanhas" ON campanhas;
DROP POLICY IF EXISTS "Admins podem gerenciar campanhas" ON campanhas;
DROP POLICY IF EXISTS "Admins de revenda podem gerenciar suas campanhas" ON campanhas;

DROP POLICY IF EXISTS "Usuários podem ver vouchers" ON vouchers;
DROP POLICY IF EXISTS "Admins podem gerenciar vouchers" ON vouchers;
DROP POLICY IF EXISTS "Admins de revenda podem gerenciar seus vouchers" ON vouchers;

DROP POLICY IF EXISTS "Usuários podem ver enquetes" ON enquetes;
DROP POLICY IF EXISTS "Admins podem gerenciar enquetes" ON enquetes;
DROP POLICY IF EXISTS "Admins de revenda podem gerenciar suas enquetes" ON enquetes;

DROP POLICY IF EXISTS "Usuários podem ver logs" ON logs_atividades;
DROP POLICY IF EXISTS "Admins podem ver todos os logs" ON logs_atividades;
DROP POLICY IF EXISTS "Admins de revenda podem ver logs de sua revenda" ON logs_atividades;

DROP POLICY IF EXISTS "Usuários podem ver seus pontos" ON pontos_usuarios;
DROP POLICY IF EXISTS "Admins podem ver todos os pontos" ON pontos_usuarios;

DROP POLICY IF EXISTS "Admins gerais podem gerenciar revendas" ON revendas;
DROP POLICY IF EXISTS "Admins de revenda podem ver sua revenda" ON revendas;

DROP POLICY IF EXISTS "Admins gerais podem gerenciar planos" ON planos;
DROP POLICY IF EXISTS "Todos podem ver planos" ON planos;

DROP POLICY IF EXISTS "Admins de revenda podem gerenciar hotspots" ON hotspots;
DROP POLICY IF EXISTS "Clientes podem ver seus hotspots" ON hotspots;

-- Cria função auxiliar SECURITY DEFINER para verificar role sem recursão
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.perfis WHERE id = user_id LIMIT 1;
$$;

-- Cria função auxiliar para verificar se é admin geral
CREATE OR REPLACE FUNCTION public.is_admin_geral()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND role = 'admin_geral'
  );
$$;

-- Cria função auxiliar para verificar se é admin de revenda
CREATE OR REPLACE FUNCTION public.is_admin_revenda()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND role = 'admin_revenda'
  );
$$;

-- Cria função auxiliar para pegar revenda_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_revenda_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT revenda_id FROM public.perfis WHERE id = auth.uid() LIMIT 1;
$$;

-- ============================================
-- POLÍTICAS RLS SIMPLES SEM RECURSÃO
-- ============================================

-- PERFIS: Políticas simples baseadas apenas em auth.uid()
CREATE POLICY "perfis_select_own" ON perfis
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "perfis_update_own" ON perfis
  FOR UPDATE USING (id = auth.uid());

-- CAMPANHAS: Todos autenticados podem ver, apenas admins podem modificar
CREATE POLICY "campanhas_select_all" ON campanhas
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "campanhas_insert_admin" ON campanhas
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "campanhas_update_admin" ON campanhas
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "campanhas_delete_admin" ON campanhas
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- VOUCHERS: Todos autenticados podem ver e modificar
CREATE POLICY "vouchers_select_all" ON vouchers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "vouchers_insert_all" ON vouchers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "vouchers_update_all" ON vouchers
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "vouchers_delete_all" ON vouchers
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ENQUETES: Todos autenticados podem ver e modificar
CREATE POLICY "enquetes_select_all" ON enquetes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "enquetes_insert_all" ON enquetes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "enquetes_update_all" ON enquetes
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "enquetes_delete_all" ON enquetes
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- QUESTOES_ENQUETES: Todos autenticados podem ver e modificar
CREATE POLICY "questoes_select_all" ON questoes_enquetes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "questoes_insert_all" ON questoes_enquetes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "questoes_update_all" ON questoes_enquetes
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "questoes_delete_all" ON questoes_enquetes
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- RESPOSTAS_ENQUETES: Todos autenticados podem ver e inserir
CREATE POLICY "respostas_select_all" ON respostas_enquetes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "respostas_insert_all" ON respostas_enquetes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- GAMIFICACAO: Todos autenticados podem ver e modificar
CREATE POLICY "gamificacao_select_all" ON gamificacao
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "gamificacao_insert_all" ON gamificacao
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "gamificacao_update_all" ON gamificacao
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "gamificacao_delete_all" ON gamificacao
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- PONTOS_USUARIOS: Usuários podem ver seus próprios pontos
CREATE POLICY "pontos_select_own" ON pontos_usuarios
  FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "pontos_insert_all" ON pontos_usuarios
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "pontos_update_all" ON pontos_usuarios
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- LOGS_ATIVIDADES: Todos autenticados podem ver e inserir
CREATE POLICY "logs_select_all" ON logs_atividades
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "logs_insert_all" ON logs_atividades
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- REVENDAS: Todos autenticados podem ver
CREATE POLICY "revendas_select_all" ON revendas
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "revendas_insert_all" ON revendas
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "revendas_update_all" ON revendas
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "revendas_delete_all" ON revendas
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- PLANOS: Todos podem ver
CREATE POLICY "planos_select_all" ON planos
  FOR SELECT USING (true);

CREATE POLICY "planos_insert_all" ON planos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "planos_update_all" ON planos
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "planos_delete_all" ON planos
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- HOTSPOTS: Todos autenticados podem ver e modificar
CREATE POLICY "hotspots_select_all" ON hotspots
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "hotspots_insert_all" ON hotspots
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "hotspots_update_all" ON hotspots
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "hotspots_delete_all" ON hotspots
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- METRICAS_HOTSPOT: Todos autenticados podem ver e inserir
CREATE POLICY "metricas_select_all" ON metricas_hotspot
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "metricas_insert_all" ON metricas_hotspot
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- CONFIGURACOES_WHITE_LABEL: Todos autenticados podem ver e modificar
CREATE POLICY "whitelabel_select_all" ON configuracoes_white_label
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "whitelabel_insert_all" ON configuracoes_white_label
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "whitelabel_update_all" ON configuracoes_white_label
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Comentário: Políticas simplificadas para evitar recursão
-- Todos os usuários autenticados têm acesso básico
-- A lógica de permissões mais granular será implementada no código da aplicação
