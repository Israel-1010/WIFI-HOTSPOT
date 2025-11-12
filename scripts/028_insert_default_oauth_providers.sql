-- Primeiro, alterar a tabela para permitir client_id NULL (providers globais)
ALTER TABLE oauth_providers ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE oauth_providers ALTER COLUMN client_secret DROP NOT NULL;
ALTER TABLE oauth_providers ALTER COLUMN redirect_uri DROP NOT NULL;

-- Adicionar comentário explicando a lógica
COMMENT ON COLUMN oauth_providers.client_id IS 'ID do cliente (NULL para providers globais configurados pelo admin geral)';
COMMENT ON COLUMN oauth_providers.client_secret IS 'Client Secret da aplicação OAuth (NULL para providers não configurados)';
COMMENT ON COLUMN oauth_providers.redirect_uri IS 'URI de redirecionamento (NULL para providers não configurados)';

-- Inserir providers OAuth padrão globais (client_id = NULL)
-- Estes providers serão usados em todos os portais hotspot

-- Google OAuth
INSERT INTO oauth_providers (
  id,
  provider,
  nome_exibicao,
  icone,
  cor_primaria,
  ativo,
  ordem,
  scopes,
  configuracoes,
  criado_em,
  atualizado_em,
  client_id,
  client_secret,
  redirect_uri
) VALUES (
  gen_random_uuid(),
  'google',
  'Conectar com Google',
  '🔵',
  '#4285F4',
  true,
  1,
  ARRAY['openid', 'profile', 'email'],
  '{"auth_url": "https://accounts.google.com/o/oauth2/v2/auth", "token_url": "https://oauth2.googleapis.com/token", "user_info_url": "https://www.googleapis.com/oauth2/v2/userinfo"}'::jsonb,
  NOW(),
  NOW(),
  NULL,
  NULL,
  NULL
) ON CONFLICT (provider) WHERE client_id IS NULL DO UPDATE SET
  nome_exibicao = EXCLUDED.nome_exibicao,
  icone = EXCLUDED.icone,
  cor_primaria = EXCLUDED.cor_primaria,
  ativo = EXCLUDED.ativo,
  ordem = EXCLUDED.ordem,
  scopes = EXCLUDED.scopes,
  configuracoes = EXCLUDED.configuracoes,
  atualizado_em = NOW(),
  client_secret = EXCLUDED.client_secret,
  redirect_uri = EXCLUDED.redirect_uri;

-- Facebook OAuth
INSERT INTO oauth_providers (
  id,
  provider,
  nome_exibicao,
  icone,
  cor_primaria,
  ativo,
  ordem,
  scopes,
  configuracoes,
  criado_em,
  atualizado_em,
  client_id,
  client_secret,
  redirect_uri
) VALUES (
  gen_random_uuid(),
  'facebook',
  'Conectar com Facebook',
  '🔵',
  '#1877F2',
  true,
  2,
  ARRAY['public_profile', 'email'],
  '{"auth_url": "https://www.facebook.com/v18.0/dialog/oauth", "token_url": "https://graph.facebook.com/v18.0/oauth/access_token", "user_info_url": "https://graph.facebook.com/me"}'::jsonb,
  NOW(),
  NOW(),
  NULL,
  NULL,
  NULL
) ON CONFLICT (provider) WHERE client_id IS NULL DO UPDATE SET
  nome_exibicao = EXCLUDED.nome_exibicao,
  icone = EXCLUDED.icone,
  cor_primaria = EXCLUDED.cor_primaria,
  ativo = EXCLUDED.ativo,
  ordem = EXCLUDED.ordem,
  scopes = EXCLUDED.scopes,
  configuracoes = EXCLUDED.configuracoes,
  atualizado_em = NOW(),
  client_secret = EXCLUDED.client_secret,
  redirect_uri = EXCLUDED.redirect_uri;

-- Instagram OAuth
INSERT INTO oauth_providers (
  id,
  provider,
  nome_exibicao,
  icone,
  cor_primaria,
  ativo,
  ordem,
  scopes,
  configuracoes,
  criado_em,
  atualizado_em,
  client_id,
  client_secret,
  redirect_uri
) VALUES (
  gen_random_uuid(),
  'instagram',
  'Conectar com Instagram',
  '📷',
  '#E4405F',
  true,
  3,
  ARRAY['user_profile', 'user_media'],
  '{"auth_url": "https://api.instagram.com/oauth/authorize", "token_url": "https://api.instagram.com/oauth/access_token", "user_info_url": "https://graph.instagram.com/me"}'::jsonb,
  NOW(),
  NOW(),
  NULL,
  NULL,
  NULL
) ON CONFLICT (provider) WHERE client_id IS NULL DO UPDATE SET
  nome_exibicao = EXCLUDED.nome_exibicao,
  icone = EXCLUDED.icone,
  cor_primaria = EXCLUDED.cor_primaria,
  ativo = EXCLUDED.ativo,
  ordem = EXCLUDED.ordem,
  scopes = EXCLUDED.scopes,
  configuracoes = EXCLUDED.configuracoes,
  atualizado_em = NOW(),
  client_secret = EXCLUDED.client_secret,
  redirect_uri = EXCLUDED.redirect_uri;

-- WhatsApp OAuth (via Facebook)
INSERT INTO oauth_providers (
  id,
  provider,
  nome_exibicao,
  icone,
  cor_primaria,
  ativo,
  ordem,
  scopes,
  configuracoes,
  criado_em,
  atualizado_em,
  client_id,
  client_secret,
  redirect_uri
) VALUES (
  gen_random_uuid(),
  'whatsapp',
  'Conectar com WhatsApp',
  '💬',
  '#25D366',
  true,
  4,
  ARRAY['whatsapp_business_management'],
  '{"auth_url": "https://www.facebook.com/v18.0/dialog/oauth", "token_url": "https://graph.facebook.com/v18.0/oauth/access_token"}'::jsonb,
  NOW(),
  NOW(),
  NULL,
  NULL,
  NULL
) ON CONFLICT (provider) WHERE client_id IS NULL DO UPDATE SET
  nome_exibicao = EXCLUDED.nome_exibicao,
  icone = EXCLUDED.icone,
  cor_primaria = EXCLUDED.cor_primaria,
  ativo = EXCLUDED.ativo,
  ordem = EXCLUDED.ordem,
  scopes = EXCLUDED.scopes,
  configuracoes = EXCLUDED.configuracoes,
  atualizado_em = NOW(),
  client_secret = EXCLUDED.client_secret,
  redirect_uri = EXCLUDED.redirect_uri;

-- Criar índice parcial para providers globais
CREATE INDEX IF NOT EXISTS idx_oauth_providers_global ON oauth_providers(provider, ativo, ordem) WHERE client_id IS NULL;

-- Criar índice para providers específicos de cliente
CREATE INDEX IF NOT EXISTS idx_oauth_providers_cliente ON oauth_providers(client_id, provider, ativo, ordem) WHERE client_id IS NOT NULL;

-- Ativar autenticação social em todas as configurações de portal existentes
UPDATE configuracoes_portal 
SET auth_social_ativo = true 
WHERE auth_social_ativo IS NULL OR auth_social_ativo = false;

-- Criar configurações padrão para clientes que não têm
INSERT INTO configuracoes_portal (
  id,
  cliente_id,
  slideshow_ativo,
  slideshow_tempo_minimo,
  auth_social_ativo,
  auth_email_ativo,
  auth_voucher_ativo,
  anuncios_obrigatorios,
  anuncios_por_sessao,
  criado_em,
  atualizado_em
)
SELECT 
  gen_random_uuid(),
  u.id,
  true,
  30,
  true,
  true,
  false,
  true,
  3,
  NOW(),
  NOW()
FROM usuarios u
WHERE u.role = 'cliente'
AND NOT EXISTS (
  SELECT 1 FROM configuracoes_portal cp WHERE cp.cliente_id = u.id
)
ON CONFLICT DO NOTHING;
