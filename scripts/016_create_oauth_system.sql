-- Sistema de Autenticação Social Centralizada
-- Gerenciado pelo Admin Geral, usado por todas as revendas

-- Tabela de configurações OAuth (gerenciada pelo Admin Geral)
CREATE TABLE IF NOT EXISTS oauth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'google', 'facebook', 'microsoft', 'apple', 'linkedin'
  nome_exibicao TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['email', 'profile'],
  ativo BOOLEAN DEFAULT true,
  icone TEXT, -- URL do ícone ou nome do ícone
  cor_primaria TEXT, -- Cor do botão
  ordem INTEGER DEFAULT 0, -- Ordem de exibição
  configuracoes JSONB DEFAULT '{}', -- Configurações adicionais
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_por UUID REFERENCES usuarios(id),
  UNIQUE(provider)
);

-- Tabela de usuários autenticados via social (dados coletados)
CREATE TABLE IF NOT EXISTS usuarios_social (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- qual provider foi usado
  provider_user_id TEXT NOT NULL, -- ID do usuário no provider
  email TEXT NOT NULL,
  nome_completo TEXT,
  foto_perfil TEXT,
  dados_adicionais JSONB DEFAULT '{}', -- outros dados do provider
  revenda_id UUID REFERENCES revendas(id),
  cliente_id UUID REFERENCES usuarios(id), -- cliente que "possui" este usuário
  hotspot_id UUID REFERENCES hotspots(id), -- hotspot onde se conectou
  primeira_conexao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultima_conexao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_conexoes INTEGER DEFAULT 1,
  aceite_termos BOOLEAN DEFAULT false,
  aceite_marketing BOOLEAN DEFAULT false,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

-- Tabela de logs de autenticação social (auditoria centralizada)
CREATE TABLE IF NOT EXISTS logs_oauth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  usuario_social_id UUID REFERENCES usuarios_social(id),
  revenda_id UUID REFERENCES revendas(id),
  cliente_id UUID REFERENCES usuarios(id),
  hotspot_id UUID REFERENCES hotspots(id),
  ip_address TEXT,
  user_agent TEXT,
  sucesso BOOLEAN DEFAULT true,
  erro TEXT,
  dados_coletados JSONB DEFAULT '{}',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sessões de usuários social (para manter login)
CREATE TABLE IF NOT EXISTS sessoes_social (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_social_id UUID REFERENCES usuarios_social(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  revenda_id UUID REFERENCES revendas(id),
  hotspot_id UUID REFERENCES hotspots(id),
  ip_address TEXT,
  user_agent TEXT,
  expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_oauth_providers_ativo ON oauth_providers(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_social_email ON usuarios_social(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_social_provider ON usuarios_social(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_social_revenda ON usuarios_social(revenda_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_social_cliente ON usuarios_social(cliente_id);
CREATE INDEX IF NOT EXISTS idx_logs_oauth_provider ON logs_oauth(provider);
CREATE INDEX IF NOT EXISTS idx_logs_oauth_revenda ON logs_oauth(revenda_id);
CREATE INDEX IF NOT EXISTS idx_logs_oauth_criado ON logs_oauth(criado_em);
CREATE INDEX IF NOT EXISTS idx_sessoes_social_token ON sessoes_social(token);
CREATE INDEX IF NOT EXISTS idx_sessoes_social_usuario ON sessoes_social(usuario_social_id);

-- Inserir providers padrão (desativados até configuração)
INSERT INTO oauth_providers (provider, nome_exibicao, client_id, client_secret, redirect_uri, icone, cor_primaria, ordem, ativo)
VALUES 
  ('google', 'Google', 'CONFIGURE_NO_ADMIN', 'CONFIGURE_NO_ADMIN', '/api/auth/callback/google', 'google', '#4285F4', 1, false),
  ('facebook', 'Facebook', 'CONFIGURE_NO_ADMIN', 'CONFIGURE_NO_ADMIN', '/api/auth/callback/facebook', 'facebook', '#1877F2', 2, false),
  ('microsoft', 'Microsoft', 'CONFIGURE_NO_ADMIN', 'CONFIGURE_NO_ADMIN', '/api/auth/callback/microsoft', 'microsoft', '#00A4EF', 3, false),
  ('apple', 'Apple', 'CONFIGURE_NO_ADMIN', 'CONFIGURE_NO_ADMIN', '/api/auth/callback/apple', 'apple', '#000000', 4, false),
  ('linkedin', 'LinkedIn', 'CONFIGURE_NO_ADMIN', 'CONFIGURE_NO_ADMIN', '/api/auth/callback/linkedin', 'linkedin', '#0A66C2', 5, false)
ON CONFLICT (provider) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE oauth_providers IS 'Configurações centralizadas de OAuth gerenciadas pelo Admin Geral';
COMMENT ON TABLE usuarios_social IS 'Usuários que se autenticaram via redes sociais';
COMMENT ON TABLE logs_oauth IS 'Logs de auditoria de todas as autenticações sociais';
COMMENT ON TABLE sessoes_social IS 'Sessões ativas de usuários autenticados via social';
