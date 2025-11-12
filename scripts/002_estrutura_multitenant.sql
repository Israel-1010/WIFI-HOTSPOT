-- =====================================================
-- ESTRUTURA MULTI-TENANT - TRÊS NÍVEIS HIERÁRQUICOS
-- =====================================================
-- 1. Admin Geral → gerencia revendas
-- 2. Admin Revenda → white label, gerencia clientes
-- 3. Cliente Final → gerencia hotspots
-- =====================================================

-- Limpar estrutura antiga se necessário
DROP TABLE IF EXISTS revendas CASCADE;
DROP TABLE IF EXISTS planos CASCADE;
DROP TABLE IF EXISTS configuracoes_whitelabel CASCADE;
DROP TABLE IF EXISTS limites_revenda CASCADE;

-- =====================================================
-- TABELA: revendas
-- Armazena informações das revendas (nível 2)
-- =====================================================
CREATE TABLE revendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- para subdomínio: slug.seudominio.com
  dominio_customizado TEXT UNIQUE, -- domínio próprio opcional
  email TEXT NOT NULL,
  telefone TEXT,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'suspensa', 'cancelada')),
  plano_id UUID, -- referência ao plano contratado
  
  -- Limites e quotas
  limite_clientes INTEGER DEFAULT 10,
  limite_hotspots INTEGER DEFAULT 50,
  limite_usuarios_simultaneos INTEGER DEFAULT 1000,
  
  -- Datas
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_expiracao TIMESTAMPTZ,
  ultima_atualizacao TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadados
  observacoes TEXT,
  dados_adicionais JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- TABELA: planos
-- Define os planos disponíveis para revendas
-- =====================================================
CREATE TABLE planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_mensal DECIMAL(10,2),
  
  -- Limites do plano
  max_clientes INTEGER NOT NULL DEFAULT 10,
  max_hotspots INTEGER NOT NULL DEFAULT 50,
  max_usuarios_simultaneos INTEGER NOT NULL DEFAULT 1000,
  
  -- Recursos incluídos
  whitelabel_completo BOOLEAN DEFAULT false,
  dominio_customizado BOOLEAN DEFAULT false,
  suporte_prioritario BOOLEAN DEFAULT false,
  api_acesso BOOLEAN DEFAULT false,
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: configuracoes_whitelabel
-- Configurações de personalização visual por revenda
-- =====================================================
CREATE TABLE configuracoes_whitelabel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  
  -- Identidade visual
  logo_url TEXT,
  favicon_url TEXT,
  cor_primaria TEXT DEFAULT '#3b82f6',
  cor_secundaria TEXT DEFAULT '#1e40af',
  cor_acento TEXT DEFAULT '#10b981',
  
  -- Textos personalizados
  nome_sistema TEXT,
  slogan TEXT,
  email_suporte TEXT,
  telefone_suporte TEXT,
  
  -- Configurações de login
  logo_login_url TEXT,
  background_login_url TEXT,
  mensagem_boas_vindas TEXT,
  
  -- Redes sociais
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  
  -- Metadados
  css_customizado TEXT,
  scripts_customizados TEXT,
  
  data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ATUALIZAR TABELA: perfis
-- Adicionar relacionamento com revendas e hierarquia
-- =====================================================
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS revenda_id UUID REFERENCES revendas(id) ON DELETE CASCADE;
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS tipo_usuario TEXT DEFAULT 'cliente' CHECK (tipo_usuario IN ('admin_geral', 'admin_revenda', 'cliente'));
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS permissoes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS cliente_pai_id UUID REFERENCES perfis(id) ON DELETE CASCADE; -- para hierarquia cliente->subcliente

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_perfis_revenda ON perfis(revenda_id);
CREATE INDEX IF NOT EXISTS idx_perfis_tipo_usuario ON perfis(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_perfis_cliente_pai ON perfis(cliente_pai_id);

-- =====================================================
-- ATUALIZAR OUTRAS TABELAS
-- Adicionar relacionamento com revendas
-- =====================================================
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS revenda_id UUID REFERENCES revendas(id) ON DELETE CASCADE;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS revenda_id UUID REFERENCES revendas(id) ON DELETE CASCADE;
ALTER TABLE enquetes ADD COLUMN IF NOT EXISTS revenda_id UUID REFERENCES revendas(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_campanhas_revenda ON campanhas(revenda_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_revenda ON vouchers(revenda_id);
CREATE INDEX IF NOT EXISTS idx_enquetes_revenda ON enquetes(revenda_id);

-- =====================================================
-- TABELA: hotspots
-- Gerenciamento de pontos de acesso por cliente
-- =====================================================
CREATE TABLE IF NOT EXISTS hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  
  nome TEXT NOT NULL,
  localizacao TEXT,
  endereco TEXT,
  
  -- Configurações Mikrotik
  mikrotik_ip TEXT NOT NULL,
  mikrotik_porta INTEGER DEFAULT 8728,
  mikrotik_usuario TEXT NOT NULL,
  mikrotik_senha TEXT NOT NULL,
  
  -- Status e métricas
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'manutencao')),
  usuarios_conectados INTEGER DEFAULT 0,
  ultima_sincronizacao TIMESTAMPTZ,
  
  -- Metadados
  configuracoes JSONB DEFAULT '{}'::jsonb,
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hotspots_revenda ON hotspots(revenda_id);
CREATE INDEX idx_hotspots_cliente ON hotspots(cliente_id);

-- =====================================================
-- TABELA: metricas_uso
-- Rastreamento de uso por revenda para billing
-- =====================================================
CREATE TABLE metricas_uso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  
  -- Período
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  
  -- Métricas
  total_clientes INTEGER DEFAULT 0,
  total_hotspots INTEGER DEFAULT 0,
  total_usuarios_unicos INTEGER DEFAULT 0,
  total_conexoes INTEGER DEFAULT 0,
  total_dados_transferidos BIGINT DEFAULT 0, -- em bytes
  
  -- Custos e receitas
  custo_calculado DECIMAL(10,2),
  
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(revenda_id, mes, ano)
);

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE revendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_whitelabel ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_uso ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar tipo de usuário
CREATE OR REPLACE FUNCTION get_user_type()
RETURNS TEXT AS $$
  SELECT tipo_usuario FROM perfis WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_revenda()
RETURNS UUID AS $$
  SELECT revenda_id FROM perfis WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Políticas para REVENDAS
CREATE POLICY "Admin geral vê todas revendas" ON revendas
  FOR SELECT USING (get_user_type() = 'admin_geral');

CREATE POLICY "Admin revenda vê sua revenda" ON revendas
  FOR SELECT USING (get_user_type() = 'admin_revenda' AND id = get_user_revenda());

CREATE POLICY "Admin geral gerencia revendas" ON revendas
  FOR ALL USING (get_user_type() = 'admin_geral');

-- Políticas para PLANOS
CREATE POLICY "Admin geral gerencia planos" ON planos
  FOR ALL USING (get_user_type() = 'admin_geral');

CREATE POLICY "Todos veem planos ativos" ON planos
  FOR SELECT USING (ativo = true);

-- Políticas para WHITELABEL
CREATE POLICY "Admin revenda gerencia seu whitelabel" ON configuracoes_whitelabel
  FOR ALL USING (revenda_id = get_user_revenda());

CREATE POLICY "Admin geral vê todos whitelabels" ON configuracoes_whitelabel
  FOR SELECT USING (get_user_type() = 'admin_geral');

-- Políticas para HOTSPOTS
CREATE POLICY "Cliente vê seus hotspots" ON hotspots
  FOR SELECT USING (cliente_id = auth.uid());

CREATE POLICY "Admin revenda vê hotspots da revenda" ON hotspots
  FOR SELECT USING (revenda_id = get_user_revenda());

CREATE POLICY "Admin geral vê todos hotspots" ON hotspots
  FOR SELECT USING (get_user_type() = 'admin_geral');

CREATE POLICY "Cliente gerencia seus hotspots" ON hotspots
  FOR ALL USING (cliente_id = auth.uid());

-- Políticas para MÉTRICAS
CREATE POLICY "Admin revenda vê métricas da revenda" ON metricas_uso
  FOR SELECT USING (revenda_id = get_user_revenda());

CREATE POLICY "Admin geral vê todas métricas" ON metricas_uso
  FOR SELECT USING (get_user_type() = 'admin_geral');

-- Atualizar políticas de PERFIS para considerar hierarquia
DROP POLICY IF EXISTS "Users can view own profile" ON perfis;
DROP POLICY IF EXISTS "Users can update own profile" ON perfis;

CREATE POLICY "Usuário vê próprio perfil" ON perfis
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admin revenda vê clientes da revenda" ON perfis
  FOR SELECT USING (
    get_user_type() = 'admin_revenda' 
    AND revenda_id = get_user_revenda()
    AND tipo_usuario = 'cliente'
  );

CREATE POLICY "Admin geral vê todos perfis" ON perfis
  FOR SELECT USING (get_user_type() = 'admin_geral');

CREATE POLICY "Usuário atualiza próprio perfil" ON perfis
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admin revenda gerencia clientes" ON perfis
  FOR ALL USING (
    get_user_type() = 'admin_revenda' 
    AND revenda_id = get_user_revenda()
    AND tipo_usuario = 'cliente'
  );

CREATE POLICY "Admin geral gerencia todos" ON perfis
  FOR ALL USING (get_user_type() = 'admin_geral');

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir planos padrão
INSERT INTO planos (nome, descricao, preco_mensal, max_clientes, max_hotspots, max_usuarios_simultaneos, whitelabel_completo, dominio_customizado) VALUES
  ('Básico', 'Plano inicial para pequenas operações', 99.90, 10, 50, 1000, false, false),
  ('Profissional', 'Plano intermediário com mais recursos', 299.90, 50, 200, 5000, true, false),
  ('Enterprise', 'Plano completo para grandes operações', 999.90, 200, 1000, 20000, true, true);

-- Criar revenda de demonstração
INSERT INTO revendas (nome, slug, email, status, limite_clientes, limite_hotspots) VALUES
  ('Revenda Demo', 'demo', 'demo@revenda.com', 'ativa', 50, 200);

-- Criar admin geral (superusuário)
-- Nota: Este usuário precisa ser criado via Supabase Auth primeiro
-- Depois você pode atualizar o perfil com:
-- UPDATE perfis SET tipo_usuario = 'admin_geral', role = 'admin' WHERE email = 'admin@sistema.com';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar data de atualização
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_atualizacao = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_revendas_updated_at BEFORE UPDATE ON revendas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para criar configuração whitelabel ao criar revenda
CREATE OR REPLACE FUNCTION create_whitelabel_config()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO configuracoes_whitelabel (revenda_id, nome_sistema)
  VALUES (NEW.id, NEW.nome);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_whitelabel AFTER INSERT ON revendas
  FOR EACH ROW EXECUTE FUNCTION create_whitelabel_config();

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View: Resumo de revendas com métricas
CREATE OR REPLACE VIEW vw_revendas_resumo AS
SELECT 
  r.id,
  r.nome,
  r.slug,
  r.status,
  r.limite_clientes,
  r.limite_hotspots,
  COUNT(DISTINCT p.id) FILTER (WHERE p.tipo_usuario = 'cliente') as total_clientes,
  COUNT(DISTINCT h.id) as total_hotspots,
  r.data_criacao,
  r.data_expiracao
FROM revendas r
LEFT JOIN perfis p ON p.revenda_id = r.id
LEFT JOIN hotspots h ON h.revenda_id = r.id
GROUP BY r.id;

-- View: Resumo de clientes por revenda
CREATE OR REPLACE VIEW vw_clientes_por_revenda AS
SELECT 
  r.id as revenda_id,
  r.nome as revenda_nome,
  p.id as cliente_id,
  p.nome_completo,
  p.email,
  COUNT(h.id) as total_hotspots,
  p.data_criacao
FROM revendas r
LEFT JOIN perfis p ON p.revenda_id = r.id AND p.tipo_usuario = 'cliente'
LEFT JOIN hotspots h ON h.cliente_id = p.id
GROUP BY r.id, r.nome, p.id, p.nome_completo, p.email, p.data_criacao;
