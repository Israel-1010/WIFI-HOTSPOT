-- Remove todas as políticas existentes que causam recursão
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Admins podem atualizar perfis" ON perfis;

-- Remove a função antiga se existir
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS get_user_role(uuid);

-- Cria função para obter role do usuário sem causar recursão
-- Usa SECURITY DEFINER para executar com privilégios do owner
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM perfis WHERE id = user_id LIMIT 1;
$$;

-- Cria função auxiliar para verificar se é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfis 
    WHERE id = auth.uid() 
    AND role IN ('admin_geral', 'admin_revenda')
  );
$$;

-- Cria função para verificar se é admin geral
CREATE OR REPLACE FUNCTION is_admin_geral()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfis 
    WHERE id = auth.uid() 
    AND role = 'admin_geral'
  );
$$;

-- Políticas para PERFIS (sem recursão)
CREATE POLICY "Usuários autenticados podem ver perfis"
  ON perfis FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON perfis FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins podem inserir perfis"
  ON perfis FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins podem deletar perfis"
  ON perfis FOR DELETE
  USING (is_admin());

-- Políticas para CAMPANHAS
DROP POLICY IF EXISTS "Todos podem ver campanhas ativas" ON campanhas;
DROP POLICY IF EXISTS "Admins podem gerenciar campanhas" ON campanhas;

CREATE POLICY "Usuários podem ver campanhas"
  ON campanhas FOR SELECT
  USING (
    CASE 
      WHEN is_admin_geral() THEN true
      WHEN is_admin() THEN revenda_id = (SELECT revenda_id FROM perfis WHERE id = auth.uid())
      ELSE status = 'active'
    END
  );

CREATE POLICY "Admins podem inserir campanhas"
  ON campanhas FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins podem atualizar campanhas"
  ON campanhas FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins podem deletar campanhas"
  ON campanhas FOR DELETE
  USING (is_admin());

-- Políticas para VOUCHERS
DROP POLICY IF EXISTS "Todos podem ver vouchers" ON vouchers;
DROP POLICY IF EXISTS "Admins podem gerenciar vouchers" ON vouchers;

CREATE POLICY "Usuários podem ver vouchers"
  ON vouchers FOR SELECT
  USING (
    CASE 
      WHEN is_admin_geral() THEN true
      WHEN is_admin() THEN revenda_id = (SELECT revenda_id FROM perfis WHERE id = auth.uid())
      ELSE status = 'active'
    END
  );

CREATE POLICY "Admins podem inserir vouchers"
  ON vouchers FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins podem atualizar vouchers"
  ON vouchers FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins podem deletar vouchers"
  ON vouchers FOR DELETE
  USING (is_admin());

-- Políticas para ENQUETES
DROP POLICY IF EXISTS "Todos podem ver enquetes" ON enquetes;
DROP POLICY IF EXISTS "Admins podem gerenciar enquetes" ON enquetes;

CREATE POLICY "Usuários podem ver enquetes"
  ON enquetes FOR SELECT
  USING (
    CASE 
      WHEN is_admin_geral() THEN true
      WHEN is_admin() THEN revenda_id = (SELECT revenda_id FROM perfis WHERE id = auth.uid())
      ELSE status = 'active'
    END
  );

CREATE POLICY "Admins podem gerenciar enquetes"
  ON enquetes FOR ALL
  USING (is_admin());

-- Políticas para LOGS_ATIVIDADES
DROP POLICY IF EXISTS "Usuários podem ver próprios logs" ON logs_atividades;
DROP POLICY IF EXISTS "Admins podem ver todos logs" ON logs_atividades;

CREATE POLICY "Usuários podem ver logs"
  ON logs_atividades FOR SELECT
  USING (
    CASE 
      WHEN is_admin_geral() THEN true
      WHEN is_admin() THEN revenda_id = (SELECT revenda_id FROM perfis WHERE id = auth.uid())
      ELSE usuario_id = auth.uid()
    END
  );

CREATE POLICY "Sistema pode inserir logs"
  ON logs_atividades FOR INSERT
  WITH CHECK (true);

-- Políticas para REVENDAS
DROP POLICY IF EXISTS "Admin geral pode gerenciar revendas" ON revendas;

CREATE POLICY "Admin geral pode ver todas revendas"
  ON revendas FOR SELECT
  USING (is_admin_geral());

CREATE POLICY "Admin revenda pode ver própria revenda"
  ON revendas FOR SELECT
  USING (id = (SELECT revenda_id FROM perfis WHERE id = auth.uid()));

CREATE POLICY "Admin geral pode gerenciar revendas"
  ON revendas FOR ALL
  USING (is_admin_geral());

-- Políticas para HOTSPOTS
DROP POLICY IF EXISTS "Usuários podem ver hotspots" ON hotspots;

CREATE POLICY "Usuários podem ver hotspots"
  ON hotspots FOR SELECT
  USING (
    CASE 
      WHEN is_admin_geral() THEN true
      WHEN is_admin() THEN revenda_id = (SELECT revenda_id FROM perfis WHERE id = auth.uid())
      ELSE cliente_id = auth.uid()
    END
  );

CREATE POLICY "Admins podem gerenciar hotspots"
  ON hotspots FOR ALL
  USING (is_admin());

-- Políticas para PLANOS
CREATE POLICY "Todos podem ver planos ativos"
  ON planos FOR SELECT
  USING (ativo = true OR is_admin_geral());

CREATE POLICY "Admin geral pode gerenciar planos"
  ON planos FOR ALL
  USING (is_admin_geral());
