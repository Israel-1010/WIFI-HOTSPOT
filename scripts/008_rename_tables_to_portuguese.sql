-- Script para renomear todas as tabelas para português e corrigir relacionamentos

-- Primeiro, desabilitar RLS temporariamente
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS surveys DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS survey_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gamification DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_logs DISABLE ROW LEVEL SECURITY;

-- Renomear tabelas para português
ALTER TABLE IF EXISTS profiles RENAME TO perfis;
ALTER TABLE IF EXISTS campaigns RENAME TO campanhas;
ALTER TABLE IF EXISTS vouchers RENAME TO vouchers;
ALTER TABLE IF EXISTS surveys RENAME TO enquetes;
ALTER TABLE IF EXISTS survey_responses RENAME TO respostas_enquetes;
ALTER TABLE IF EXISTS gamification RENAME TO gamificacao;
ALTER TABLE IF EXISTS user_points RENAME TO pontos_usuarios;
ALTER TABLE IF EXISTS analytics RENAME TO analiticas;
ALTER TABLE IF EXISTS activity_logs RENAME TO logs_atividades;

-- Adicionar foreign key entre perfis e pontos_usuarios
ALTER TABLE pontos_usuarios 
DROP CONSTRAINT IF EXISTS pontos_usuarios_user_id_fkey;

ALTER TABLE pontos_usuarios
ADD CONSTRAINT pontos_usuarios_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES perfis(id) ON DELETE CASCADE;

-- Criar view 'logs' que aponta para 'logs_atividades' (para compatibilidade)
CREATE OR REPLACE VIEW logs AS SELECT * FROM logs_atividades;

-- Recriar políticas RLS com nomes em português
DROP POLICY IF EXISTS "Users can view own profile" ON perfis;
DROP POLICY IF EXISTS "Users can update own profile" ON perfis;
DROP POLICY IF EXISTS "Admins can view all profiles" ON perfis;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON perfis;

-- Função helper para verificar se é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM perfis 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para perfis
CREATE POLICY "Users can view own profile" ON perfis
  FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can update own profile" ON perfis
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON perfis
  FOR ALL USING (is_admin());

-- Políticas para campanhas
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON campanhas;
DROP POLICY IF EXISTS "Admins can manage campaigns" ON campanhas;

CREATE POLICY "Anyone can view active campaigns" ON campanhas
  FOR SELECT USING (status = 'active' OR is_admin());

CREATE POLICY "Admins can manage campaigns" ON campanhas
  FOR ALL USING (is_admin());

-- Políticas para vouchers
DROP POLICY IF EXISTS "Anyone can view active vouchers" ON vouchers;
DROP POLICY IF EXISTS "Admins can manage vouchers" ON vouchers;

CREATE POLICY "Anyone can view active vouchers" ON vouchers
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage vouchers" ON vouchers
  FOR ALL USING (is_admin());

-- Políticas para enquetes
DROP POLICY IF EXISTS "Anyone can view active surveys" ON enquetes;
DROP POLICY IF EXISTS "Admins can manage surveys" ON enquetes;

CREATE POLICY "Anyone can view active surveys" ON enquetes
  FOR SELECT USING (status = 'active' OR is_admin());

CREATE POLICY "Admins can manage surveys" ON enquetes
  FOR ALL USING (is_admin());

-- Políticas para respostas de enquetes
DROP POLICY IF EXISTS "Users can submit survey responses" ON respostas_enquetes;
DROP POLICY IF EXISTS "Users can view own responses" ON respostas_enquetes;
DROP POLICY IF EXISTS "Admins can view all responses" ON respostas_enquetes;

CREATE POLICY "Users can submit survey responses" ON respostas_enquetes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own responses" ON respostas_enquetes
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins can view all responses" ON respostas_enquetes
  FOR SELECT USING (is_admin());

-- Políticas para gamificação
DROP POLICY IF EXISTS "Anyone can view active gamification" ON gamificacao;
DROP POLICY IF EXISTS "Admins can manage gamification" ON gamificacao;

CREATE POLICY "Anyone can view active gamification" ON gamificacao
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage gamification" ON gamificacao
  FOR ALL USING (is_admin());

-- Políticas para pontos de usuários
DROP POLICY IF EXISTS "Users can view own points" ON pontos_usuarios;
DROP POLICY IF EXISTS "Admins can view all points" ON pontos_usuarios;
DROP POLICY IF EXISTS "Admins can manage points" ON pontos_usuarios;

CREATE POLICY "Users can view own points" ON pontos_usuarios
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins can view all points" ON pontos_usuarios
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage points" ON pontos_usuarios
  FOR ALL USING (is_admin());

-- Políticas para analytics
DROP POLICY IF EXISTS "Admins can view analytics" ON analiticas;
DROP POLICY IF EXISTS "System can insert analytics" ON analiticas;

CREATE POLICY "Admins can view analytics" ON analiticas
  FOR SELECT USING (is_admin());

CREATE POLICY "System can insert analytics" ON analiticas
  FOR INSERT WITH CHECK (true);

-- Políticas para logs de atividades
DROP POLICY IF EXISTS "Users can view own logs" ON logs_atividades;
DROP POLICY IF EXISTS "Admins can view all logs" ON logs_atividades;
DROP POLICY IF EXISTS "System can insert logs" ON logs_atividades;

CREATE POLICY "Users can view own logs" ON logs_atividades
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins can view all logs" ON logs_atividades
  FOR SELECT USING (is_admin());

CREATE POLICY "System can insert logs" ON logs_atividades
  FOR INSERT WITH CHECK (true);

-- Reabilitar RLS
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_enquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE analiticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_atividades ENABLE ROW LEVEL SECURITY;

-- Atualizar trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  
  -- Criar pontos iniciais para o usuário
  INSERT INTO public.pontos_usuarios (user_id, points, level)
  VALUES (NEW.id, 0, 1);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
