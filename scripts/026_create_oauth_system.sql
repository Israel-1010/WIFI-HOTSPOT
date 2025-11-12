-- Criar tabela de providers OAuth configurados pelo admin geral
CREATE TABLE IF NOT EXISTS oauth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL, -- 'google', 'facebook', 'instagram', 'whatsapp'
  nome_exibicao VARCHAR(100) NOT NULL,
  icone TEXT,
  cor_primaria VARCHAR(7),
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['email', 'profile'],
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider)
);

-- Criar tabela de usuários sociais (visitantes do Wi-Fi)
CREATE TABLE IF NOT EXISTS usuarios_social (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  nome VARCHAR(255),
  foto_url TEXT,
  telefone VARCHAR(50),
  dados_completos JSONB,
  cliente_id UUID REFERENCES usuarios(id),
  hotspot_id UUID,
  primeira_conexao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultima_conexao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_conexoes INTEGER DEFAULT 1,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

-- Criar tabela de sessões Wi-Fi
CREATE TABLE IF NOT EXISTS sessoes_wifi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_social_id UUID REFERENCES usuarios_social(id),
  hotspot_id UUID,
  cliente_id UUID REFERENCES usuarios(id),
  ip_address VARCHAR(45),
  mac_address VARCHAR(17),
  user_agent TEXT,
  inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fim TIMESTAMP WITH TIME ZONE,
  duracao_segundos INTEGER,
  bytes_enviados BIGINT DEFAULT 0,
  bytes_recebidos BIGINT DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_oauth_providers_ativo ON oauth_providers(ativo, ordem);
CREATE INDEX IF NOT EXISTS idx_usuarios_social_provider ON usuarios_social(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_social_cliente ON usuarios_social(cliente_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_wifi_usuario ON sessoes_wifi(usuario_social_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_wifi_cliente ON sessoes_wifi(cliente_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_wifi_inicio ON sessoes_wifi(inicio);

-- Habilitar RLS
ALTER TABLE oauth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_social ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_wifi ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para oauth_providers (apenas admin geral pode gerenciar)
CREATE POLICY "Admin geral pode gerenciar providers OAuth"
  ON oauth_providers FOR ALL
  USING (true);

-- Políticas RLS para usuarios_social (público pode inserir, clientes podem ver seus próprios)
CREATE POLICY "Público pode criar usuários sociais"
  ON usuarios_social FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Clientes podem ver seus usuários sociais"
  ON usuarios_social FOR SELECT
  USING (true);

-- Políticas RLS para sessoes_wifi
CREATE POLICY "Público pode criar sessões Wi-Fi"
  ON sessoes_wifi FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Clientes podem ver suas sessões"
  ON sessoes_wifi FOR SELECT
  USING (true);

-- Inserir providers OAuth padrão (desativados até configuração)
INSERT INTO oauth_providers (provider, nome_exibicao, icone, cor_primaria, client_id, client_secret, redirect_uri, ativo, ordem)
VALUES 
  ('google', 'Continuar com Google', '🔵', '#4285F4', 'CONFIGURE_NO_ADMIN', 'CONFIGURE_NO_ADMIN', 'http://localhost:3000/api/auth/google/callback', false, 1),
  ('facebook', 'Continuar com Facebook', '📘', '#1877F2', 'CONFIGURE_NO_ADMIN', 'CONFIGURE_NO_ADMIN', 'http://localhost:3000/api/auth/facebook/callback', false, 2),
  ('instagram', 'Continuar com Instagram', '📷', '#E4405F', 'CONFIGURE_NO_ADMIN', 'CONFIGURE_NO_ADMIN', 'http://localhost:3000/api/auth/instagram/callback', false, 3)
ON CONFLICT (provider) DO NOTHING;

COMMENT ON TABLE oauth_providers IS 'Providers OAuth configurados pelo admin geral para autenticação social no portal hotspot';
COMMENT ON TABLE usuarios_social IS 'Usuários que se conectaram via redes sociais no portal hotspot';
COMMENT ON TABLE sessoes_wifi IS 'Sessões de conexão Wi-Fi dos usuários sociais';
