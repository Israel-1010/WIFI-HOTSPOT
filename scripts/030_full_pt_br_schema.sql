-- ============================================
-- ESQUEMA COMPLETO (PORTUGUÊS)
-- Provisiona todas as tabelas usadas pelo app
-- Execute com o Supabase SQL editor ou CLI
-- ============================================
BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Remove artefatos anteriores para garantir consistência
DROP TABLE IF EXISTS public.survey_responses CASCADE;
DROP TABLE IF EXISTS public.questoes_enquetes CASCADE;
DROP TABLE IF EXISTS public.enquetes CASCADE;
DROP TABLE IF EXISTS public.envios_campanha CASCADE;
DROP TABLE IF EXISTS public.campanhas_marketing CASCADE;
DROP TABLE IF EXISTS public.interacoes_anuncios CASCADE;
DROP TABLE IF EXISTS public.anuncios CASCADE;
DROP TABLE IF EXISTS public.portal_config CASCADE;
DROP TABLE IF EXISTS public.configuracoes_portal CASCADE;
DROP TABLE IF EXISTS public.configuracoes_whitelabel CASCADE;
DROP TABLE IF EXISTS public.configuracoes_cobranca CASCADE;
DROP TABLE IF EXISTS public.pipeline_vendas CASCADE;
DROP TABLE IF EXISTS public.propostas_comerciais CASCADE;
DROP TABLE IF EXISTS public.base_conhecimento CASCADE;
DROP TABLE IF EXISTS public.tickets_suporte CASCADE;
DROP TABLE IF EXISTS public.respostas_ticket CASCADE;
DROP TABLE IF EXISTS public.hotspots CASCADE;
DROP TABLE IF EXISTS public.sessoes_wifi CASCADE;
DROP TABLE IF EXISTS public.vouchers CASCADE;
DROP TABLE IF EXISTS public.logs_atividades CASCADE;
DROP TABLE IF EXISTS public.logs_acesso CASCADE;
DROP TABLE IF EXISTS public.logs_oauth CASCADE;
DROP TABLE IF EXISTS public.webhook_logs CASCADE;
DROP TABLE IF EXISTS public.sessoes_social CASCADE;
DROP TABLE IF EXISTS public.usuarios_social CASCADE;
DROP TABLE IF EXISTS public.oauth_providers CASCADE;
DROP TABLE IF EXISTS public.gamificacao CASCADE;
DROP TABLE IF EXISTS public.faturas CASCADE;
DROP TABLE IF EXISTS public.integracoes_revenda CASCADE;
DROP TABLE IF EXISTS public.equipe_revenda CASCADE;
DROP TABLE IF EXISTS public.revendas CASCADE;
DROP TABLE IF EXISTS public.planos CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.perfis CASCADE;
DROP TABLE IF EXISTS public.sessoes_usuarios CASCADE;
DROP TABLE IF EXISTS public.campanhas CASCADE;

-- Função utilitária para atualizar campos atualizado_em
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PLANOS & REVENDAS -----------------------------------
CREATE TABLE public.planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_mensal NUMERIC(10,2) NOT NULL,
  limite_clientes INTEGER DEFAULT 0,
  limite_hotspots INTEGER DEFAULT 0,
  limite_usuarios INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.revendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  email TEXT,
  telefone TEXT,
  dominio TEXT UNIQUE,
  plano_id UUID REFERENCES public.planos(id) ON DELETE SET NULL,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  logo_url TEXT,
  cor_primaria TEXT,
  cor_secundaria TEXT,
  limite_clientes INTEGER,
  limite_hotspots INTEGER,
  limite_usuarios_simultaneos INTEGER,
  status TEXT DEFAULT 'ativa',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- PERFIS & USUÁRIOS -----------------------------------
CREATE TABLE public.perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'cliente',
  tipo_usuario TEXT DEFAULT 'cliente',
  revenda_id UUID REFERENCES public.revendas(id) ON DELETE SET NULL,
  cliente_id UUID,
  permissoes JSONB DEFAULT '{}'::jsonb,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  nome_completo TEXT NOT NULL,
  telefone TEXT,
  role TEXT NOT NULL DEFAULT 'cliente',
  senha_hash TEXT NOT NULL,
  revenda_id UUID REFERENCES public.revendas(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  permissoes JSONB DEFAULT '{}'::jsonb,
  ativo BOOLEAN DEFAULT TRUE,
  ultimo_acesso TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.sessoes_usuarios (
  token TEXT PRIMARY KEY,
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  expira_em TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- CLIENTES / TENANTS ----------------------------------
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID REFERENCES public.revendas(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.usuarios_social (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  revenda_id UUID REFERENCES public.revendas(id) ON DELETE SET NULL,
  provider TEXT,
  provider_user_id TEXT,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  genero TEXT,
  idade INTEGER,
  faixa_etaria TEXT,
  data_nascimento DATE,
  cidade TEXT,
  estado TEXT,
  consentiu_marketing BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.sessoes_social (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_social_id UUID REFERENCES public.usuarios_social(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- CAMPANHAS E ENQUETES --------------------------------
CREATE TABLE public.campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  descricao TEXT,
  conteudo JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa','pausada','concluida','rascunho')),
  visualizacoes INTEGER DEFAULT 0,
  cliques INTEGER DEFAULT 0,
  conversoes INTEGER DEFAULT 0,
  data_inicio DATE,
  data_fim DATE,
  revenda_id UUID REFERENCES public.revendas(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  criado_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.envios_campanha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID REFERENCES public.campanhas(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
  usuario_social_id UUID REFERENCES public.usuarios_social(id) ON DELETE CASCADE,
  enviado_em TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pendente',
  erro TEXT
);

CREATE TABLE public.enquetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'ativa',
  data_inicio DATE,
  data_fim DATE,
  total_respostas INTEGER DEFAULT 0,
  cliente_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  criado_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.questoes_enquetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquete_id UUID REFERENCES public.enquetes(id) ON DELETE CASCADE,
  pergunta TEXT NOT NULL,
  tipo TEXT NOT NULL,
  opcoes JSONB,
  obrigatoria BOOLEAN DEFAULT FALSE,
  ordem INTEGER DEFAULT 1
);

CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquete_id UUID REFERENCES public.enquetes(id) ON DELETE CASCADE,
  respostas JSONB NOT NULL,
  usuario_id UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ANÚNCIOS & MARKETING -------------------------------
CREATE TABLE public.anuncios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'imagem',
  imagem_url TEXT,
  video_url TEXT,
  html TEXT,
  cta_texto_sim TEXT DEFAULT 'Tenho interesse',
  cta_texto_nao TEXT DEFAULT 'Não tenho interesse',
  tempo_exibicao INTEGER DEFAULT 30,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.interacoes_anuncios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anuncio_id UUID REFERENCES public.anuncios(id) ON DELETE CASCADE,
  usuario_social_id UUID REFERENCES public.usuarios_social(id) ON DELETE SET NULL,
  sessao_id UUID,
  resposta TEXT,
  ip_address INET,
  user_agent TEXT,
  hotspot_id UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.campanhas_marketing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'rascunho',
  filtro_genero TEXT,
  filtro_idade_min INTEGER,
  filtro_idade_max INTEGER,
  filtro_interesse TEXT,
  filtro_anuncio_ids UUID[],
  total_enviados INTEGER DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- HOTSPOT / PORTAL -----------------------------------
CREATE TABLE public.hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  ssid TEXT,
  endereco TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  status TEXT DEFAULT 'online',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.sessoes_wifi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotspot_id UUID REFERENCES public.hotspots(id) ON DELETE CASCADE,
  usuario VARCHAR(64),
  mac_address TEXT,
  ip_address INET,
  iniciou_em TIMESTAMPTZ DEFAULT NOW(),
  finalizou_em TIMESTAMPTZ,
  status TEXT DEFAULT 'conectado'
);

CREATE TABLE public.portal_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID UNIQUE NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  business_name TEXT,
  welcome_message TEXT,
  ssid TEXT,
  logo_url TEXT,
  brand_color TEXT,
  background_color TEXT,
  text_color TEXT,
  secondary_text_color TEXT,
  title_size TEXT,
  card_style TEXT,
  login_voucher BOOLEAN DEFAULT TRUE,
  login_facebook BOOLEAN DEFAULT FALSE,
  login_google BOOLEAN DEFAULT FALSE,
  login_instagram BOOLEAN DEFAULT FALSE,
  login_whatsapp BOOLEAN DEFAULT FALSE,
  login_email BOOLEAN DEFAULT FALSE,
  login_phone BOOLEAN DEFAULT FALSE,
  login_user_password BOOLEAN DEFAULT FALSE,
  terms_required BOOLEAN DEFAULT TRUE,
  show_campaigns BOOLEAN DEFAULT TRUE,
  campaign_timing TEXT DEFAULT 'before',
  show_surveys BOOLEAN DEFAULT FALSE,
  survey_timing TEXT DEFAULT 'after',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- WHITE LABEL E CONFIG -------------------------------
CREATE TABLE public.configuracoes_whitelabel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID UNIQUE REFERENCES public.revendas(id) ON DELETE CASCADE,
  tema JSONB DEFAULT '{}'::jsonb,
  contato JSONB DEFAULT '{}'::jsonb,
  juridico JSONB DEFAULT '{}'::jsonb,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.configuracoes_portal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
  configuracoes JSONB DEFAULT '{}'::jsonb,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.configuracoes_cobranca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID REFERENCES public.revendas(id) ON DELETE CASCADE,
  dados JSONB DEFAULT '{}'::jsonb,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- OUTRAS TABELAS DE SUPORTE --------------------------
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  descricao TEXT,
  limite_uso INTEGER,
  expiracao TIMESTAMPTZ,
  cliente_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.logs_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  mensagem TEXT,
  usuario_nome TEXT,
  ip_address INET,
  mac_address TEXT,
  detalhes JSONB DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.logs_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID,
  username TEXT,
  acao TEXT,
  mensagem TEXT,
  sucesso BOOLEAN,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.logs_oauth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT,
  payload JSONB,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.oauth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  configuracoes JSONB DEFAULT '{}'::jsonb,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.integracoes_revenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID REFERENCES public.revendas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  configuracoes JSONB DEFAULT '{}'::jsonb,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.equipe_revenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID REFERENCES public.revendas(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  role TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.pipeline_vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID REFERENCES public.revendas(id) ON DELETE CASCADE,
  cliente TEXT,
  valor NUMERIC(10,2),
  etapa TEXT,
  probabilidade INTEGER,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.propostas_comerciais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID REFERENCES public.revendas(id) ON DELETE CASCADE,
  cliente TEXT,
  valor NUMERIC(10,2),
  status TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.base_conhecimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT,
  conteudo TEXT,
  categoria TEXT,
  publicado BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.tickets_suporte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
  assunto TEXT,
  descricao TEXT,
  status TEXT DEFAULT 'aberto',
  prioridade TEXT DEFAULT 'media',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.respostas_ticket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets_suporte(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  mensagem TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID REFERENCES public.revendas(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL,
  vencimento DATE NOT NULL,
  status TEXT DEFAULT 'pendente',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.gamificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
  configuracoes JSONB DEFAULT '{}'::jsonb,
  ativo BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destino TEXT,
  payload JSONB,
  status TEXT,
  tentativa INTEGER DEFAULT 1,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- TRIGGERS PARA atualizar atualizado_em
CREATE TRIGGER trg_touch_revendas BEFORE UPDATE ON public.revendas FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_planos BEFORE UPDATE ON public.planos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_campanhas BEFORE UPDATE ON public.campanhas FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_enquetes BEFORE UPDATE ON public.enquetes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_perfis BEFORE UPDATE ON public.perfis FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_usuarios BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_portal_config BEFORE UPDATE ON public.portal_config FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_integracoes BEFORE UPDATE ON public.integracoes_revenda FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_anuncios BEFORE UPDATE ON public.anuncios FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_campanhas_marketing BEFORE UPDATE ON public.campanhas_marketing FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_touch_usuarios_social BEFORE UPDATE ON public.usuarios_social FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- INSERIR DADOS BÁSICOS PARA TESTES
INSERT INTO public.planos (id, nome, descricao, preco_mensal, limite_clientes, limite_hotspots, limite_usuarios, ativo)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Starter', 'Plano básico para até 10 sites', 299.90, 10, 20, 100, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.revendas (id, nome, cnpj, email, telefone, dominio, plano_id, cor_primaria, cor_secundaria, status)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'Revenda Demo', '12.345.678/0001-90', 'revenda@demo.com', '+55 11 99999-0000',
   'revenda.demo.com', '11111111-1111-1111-1111-111111111111', '#2563eb', '#1d4ed8', 'ativa')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.perfis (id, nome, email, role, tipo_usuario, revenda_id)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'Admin Geral', 'admin@demo.com', 'admin', 'admin_geral', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.usuarios (
  id, username, email, nome_completo, role, senha_hash, revenda_id, cliente_id, ativo
)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'admin',
  'admin@demo.com',
  'Administrador',
  'admin_geral',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
