-- Tabela de usuários customizados (sem Supabase Auth)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  senha_hash text NOT NULL,
  nome_completo text NOT NULL,
  email text UNIQUE NOT NULL,
  telefone text,
  role text NOT NULL CHECK (role IN ('cliente', 'admin_revenda', 'admin_geral', 'operador', 'suporte')),
  revenda_id uuid REFERENCES public.revendas(id) ON DELETE CASCADE,
  ativo boolean DEFAULT true,
  permissoes jsonb DEFAULT '[]'::jsonb,
  ultimo_acesso timestamp with time zone,
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON public.usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON public.usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_revenda ON public.usuarios(revenda_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON public.usuarios(ativo);

-- Tabela de sessões para gerenciar login
CREATE TABLE IF NOT EXISTS public.sessoes_usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  ip_address text,
  user_agent text,
  expira_em timestamp with time zone NOT NULL,
  criado_em timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON public.sessoes_usuarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_token ON public.sessoes_usuarios(token);
CREATE INDEX IF NOT EXISTS idx_sessoes_expira ON public.sessoes_usuarios(expira_em);

-- Tabela de logs de acesso
CREATE TABLE IF NOT EXISTS public.logs_acesso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  username text,
  acao text NOT NULL, -- 'login', 'logout', 'falha_login'
  ip_address text,
  user_agent text,
  sucesso boolean DEFAULT true,
  mensagem text,
  criado_em timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_acesso_usuario ON public.logs_acesso(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_acesso_criado ON public.logs_acesso(criado_em);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_usuarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_usuarios_updated_at();

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION limpar_sessoes_expiradas()
RETURNS void AS $$
BEGIN
  DELETE FROM public.sessoes_usuarios WHERE expira_em < now();
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessoes_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_acesso ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.usuarios FOR SELECT
  USING (true); -- Será controlado pela aplicação

CREATE POLICY "Admin geral pode gerenciar todos os usuários"
  ON public.usuarios FOR ALL
  USING (true); -- Será controlado pela aplicação

-- Políticas para sessoes
CREATE POLICY "Usuários podem ver suas próprias sessões"
  ON public.sessoes_usuarios FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode gerenciar sessões"
  ON public.sessoes_usuarios FOR ALL
  USING (true);

-- Políticas para logs
CREATE POLICY "Admin pode ver todos os logs"
  ON public.logs_acesso FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode inserir logs"
  ON public.logs_acesso FOR INSERT
  WITH CHECK (true);

-- Inserir usuário admin padrão (senha: admin123)
-- Hash bcrypt de 'admin123' com salt 10
INSERT INTO public.usuarios (username, senha_hash, nome_completo, email, role, permissoes)
VALUES (
  'admin',
  '$2a$10$rKvVPZqGvqVvVqVvVqVvVeJ3qVqVqVqVqVqVqVqVqVqVqVqVqVqVq', -- Placeholder - será substituído pela aplicação
  'Administrador Geral',
  'admin@sistema.com',
  'admin_geral',
  '["*"]'::jsonb
)
ON CONFLICT (username) DO NOTHING;

-- Inserir alguns usuários de exemplo
INSERT INTO public.usuarios (username, senha_hash, nome_completo, email, role, permissoes)
VALUES 
  ('operador1', '$2a$10$placeholder', 'Operador Um', 'operador1@sistema.com', 'operador', '["campanhas.view", "vouchers.view"]'::jsonb),
  ('suporte1', '$2a$10$placeholder', 'Suporte Um', 'suporte1@sistema.com', 'suporte', '["logs.view", "usuarios.view"]'::jsonb)
ON CONFLICT (username) DO NOTHING;

COMMENT ON TABLE public.usuarios IS 'Tabela de usuários customizados com autenticação própria';
COMMENT ON TABLE public.sessoes_usuarios IS 'Sessões ativas de usuários customizados';
COMMENT ON TABLE public.logs_acesso IS 'Logs de acesso e autenticação de usuários customizados';
