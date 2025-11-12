-- =====================================================
-- SCRIPT COMPLETO: Sistema Multi-Tenant HotSpot 360
-- =====================================================
-- Este script cria toda a estrutura do banco de dados:
-- 1. Tabelas básicas (perfis, campanhas, vouchers, enquetes)
-- 2. Estrutura multi-tenant (revendas, planos, hotspots)
-- 3. Políticas RLS sem recursão
-- 4. Funções e triggers
-- 5. Dados de seed para teste
-- =====================================================

-- =====================================================
-- PARTE 1: FUNÇÕES AUXILIARES
-- =====================================================

-- Função para verificar se usuário é admin geral
CREATE OR REPLACE FUNCTION is_admin_geral()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin_geral'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é admin de revenda
CREATE OR REPLACE FUNCTION is_admin_revenda()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin_revenda'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é cliente
CREATE OR REPLACE FUNCTION is_cliente()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'cliente'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTE 2: TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de Revendas (White Label)
CREATE TABLE revendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  dominio TEXT UNIQUE,
  logo_url TEXT,
  cor_primaria TEXT DEFAULT '#3b82f6',
  cor_secundaria TEXT DEFAULT '#1e40af',
  plano_id UUID,
  status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'suspensa', 'cancelada')),
  limite_clientes INTEGER DEFAULT 10,
  limite_hotspots INTEGER DEFAULT 5,
  limite_usuarios_simultaneos INTEGER DEFAULT 100,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Planos
CREATE TABLE planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_mensal DECIMAL(10,2),
  limite_clientes INTEGER,
  limite_hotspots INTEGER,
  limite_usuarios_simultaneos INTEGER,
  recursos JSONB DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Perfis (usuários do sistema)
CREATE TABLE perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin_geral', 'admin_revenda', 'cliente')),
  revenda_id UUID REFERENCES revendas(id) ON DELETE CASCADE,
  avatar_url TEXT,
  telefone TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Hotspots (APs gerenciados)
CREATE TABLE hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  localizacao TEXT,
  endereco_ip TEXT NOT NULL,
  porta INTEGER DEFAULT 8728,
  usuario_mikrotik TEXT NOT NULL,
  senha_mikrotik TEXT NOT NULL,
  revenda_id UUID REFERENCES revendas(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES perfis(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'manutencao')),
  usuarios_conectados INTEGER DEFAULT 0,
  ultima_sincronizacao TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Campanhas
CREATE TABLE campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('banner', 'popup', 'video', 'enquete')),
  descricao TEXT,
  conteudo JSONB DEFAULT '{}',
  status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'finalizada')),
  visualizacoes INTEGER DEFAULT 0,
  cliques INTEGER DEFAULT 0,
  conversoes INTEGER DEFAULT 0,
  data_inicio DATE,
  data_fim DATE,
  revenda_id UUID REFERENCES revendas(id) ON DELETE CASCADE,
  criado_por UUID REFERENCES perfis(id),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Vouchers
CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('tempo', 'dados', 'ilimitado')),
  valor TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'usado', 'expirado')),
  data_validade DATE,
  quantidade_total INTEGER DEFAULT 1,
  quantidade_usada INTEGER DEFAULT 0,
  revenda_id UUID REFERENCES revendas(id) ON DELETE CASCADE,
  criado_por UUID REFERENCES perfis(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Enquetes
CREATE TABLE enquetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'finalizada')),
  data_inicio DATE,
  data_fim DATE,
  total_respostas INTEGER DEFAULT 0,
  revenda_id UUID REFERENCES revendas(id) ON DELETE CASCADE,
  criado_por UUID REFERENCES perfis(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Questões de Enquetes
CREATE TABLE questoes_enquetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquete_id UUID REFERENCES enquetes(id) ON DELETE CASCADE,
  pergunta TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('multipla_escolha', 'texto', 'escala')),
  opcoes JSONB DEFAULT '[]',
  obrigatoria BOOLEAN DEFAULT false,
  ordem INTEGER DEFAULT 0
);

-- Tabela de Respostas de Enquetes
CREATE TABLE respostas_enquetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquete_id UUID REFERENCES enquetes(id) ON DELETE CASCADE,
  questao_id UUID REFERENCES questoes_enquetes(id) ON DELETE CASCADE,
  usuario_id UUID,
  resposta TEXT NOT NULL,
  respondido_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Gamificação
CREATE TABLE gamificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('missao', 'recompensa', 'conquista')),
  descricao TEXT,
  pontos INTEGER DEFAULT 0,
  icone TEXT,
  condicoes JSONB DEFAULT '{}',
  status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa')),
  revenda_id UUID REFERENCES revendas(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Pontos de Usuários
CREATE TABLE pontos_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES perfis(id) ON DELETE CASCADE,
  pontos_totais INTEGER DEFAULT 0,
  nivel INTEGER DEFAULT 1,
  conquistas JSONB DEFAULT '[]',
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Logs de Atividades
CREATE TABLE logs_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('conexao', 'desconexao', 'autenticacao', 'erro', 'sistema')),
  usuario_id UUID REFERENCES perfis(id),
  usuario_nome TEXT,
  hotspot_id UUID REFERENCES hotspots(id),
  ip_address TEXT,
  mac_address TEXT,
  mensagem TEXT NOT NULL,
  detalhes JSONB DEFAULT '{}',
  revenda_id UUID REFERENCES revendas(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Métricas de Uso
CREATE TABLE metricas_uso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID REFERENCES revendas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  total_usuarios INTEGER DEFAULT 0,
  total_sessoes INTEGER DEFAULT 0,
  tempo_medio_sessao INTEGER DEFAULT 0,
  dados_transferidos BIGINT DEFAULT 0,
  pico_usuarios_simultaneos INTEGER DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(revenda_id, data)
);

-- =====================================================
-- PARTE 3: ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_perfis_revenda ON perfis(revenda_id);
CREATE INDEX idx_perfis_role ON perfis(role);
CREATE INDEX idx_hotspots_revenda ON hotspots(revenda_id);
CREATE INDEX idx_hotspots_cliente ON hotspots(cliente_id);
CREATE INDEX idx_campanhas_revenda ON campanhas(revenda_id);
CREATE INDEX idx_vouchers_revenda ON vouchers(revenda_id);
CREATE INDEX idx_enquetes_revenda ON enquetes(revenda_id);
CREATE INDEX idx_logs_revenda ON logs_atividades(revenda_id);
CREATE INDEX idx_logs_tipo ON logs_atividades(tipo);
CREATE INDEX idx_logs_criado_em ON logs_atividades(criado_em);

-- =====================================================
-- PARTE 4: POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE revendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questoes_enquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_enquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_uso ENABLE ROW LEVEL SECURITY;

-- Políticas para REVENDAS
CREATE POLICY "Admin geral vê todas revendas" ON revendas FOR SELECT USING (is_admin_geral());
CREATE POLICY "Admin geral gerencia revendas" ON revendas FOR ALL USING (is_admin_geral());
CREATE POLICY "Admin revenda vê sua revenda" ON revendas FOR SELECT USING (
  is_admin_revenda() AND id IN (SELECT revenda_id FROM perfis WHERE id = auth.uid())
);

-- Políticas para PLANOS
CREATE POLICY "Admin geral gerencia planos" ON planos FOR ALL USING (is_admin_geral());
CREATE POLICY "Todos veem planos ativos" ON planos FOR SELECT USING (ativo = true);

-- Políticas para PERFIS
CREATE POLICY "Usuário vê próprio perfil" ON perfis FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admin geral vê todos perfis" ON perfis FOR SELECT USING (is_admin_geral());
CREATE POLICY "Admin revenda vê perfis da revenda" ON perfis FOR SELECT USING (
  is_admin_revenda() AND revenda_id IN (SELECT revenda_id FROM perfis WHERE id = auth.uid())
);
CREATE POLICY "Admin geral gerencia perfis" ON perfis FOR ALL USING (is_admin_geral());
CREATE POLICY "Admin revenda gerencia perfis da revenda" ON perfis FOR ALL USING (
  is_admin_revenda() AND revenda_id IN (SELECT revenda_id FROM perfis WHERE id = auth.uid())
);

-- Políticas para HOTSPOTS
CREATE POLICY "Admin geral vê todos hotspots" ON hotspots FOR SELECT USING (is_admin_geral());
CREATE POLICY "Admin revenda vê hotspots da revenda" ON hotspots FOR SELECT USING (
  is_admin_revenda() AND revenda_id IN (SELECT revenda_id FROM perfis WHERE id = auth.uid())
);
CREATE POLICY "Cliente vê seus hotspots" ON hotspots FOR SELECT USING (
  is_cliente() AND cliente_id = auth.uid()
);
CREATE POLICY "Admin revenda gerencia hotspots" ON hotspots FOR ALL USING (
  is_admin_revenda() AND revenda_id IN (SELECT revenda_id FROM perfis WHERE id = auth.uid())
);

-- Políticas para CAMPANHAS
CREATE POLICY "Admin geral vê todas campanhas" ON campanhas FOR SELECT USING (is_admin_geral());
CREATE POLICY "Admin revenda vê campanhas da revenda" ON campanhas FOR SELECT USING (
  is_admin_revenda() AND revenda_id IN (SELECT revenda_id FROM perfis WHERE id = auth.uid())
);
CREATE POLICY "Admin revenda gerencia campanhas" ON campanhas FOR ALL USING (
  is_admin_revenda() AND revenda_id IN (SELECT revenda_id FROM perfis WHERE id = auth.uid())
);

-- Políticas para VOUCHERS
CREATE POLICY "Admin geral vê todos vouchers" ON vouchers FOR SELECT USING (is_admin_geral());
CREATE POLICY "Admin revenda vê vouchers da revenda" ON vouchers FOR SELECT USING (
  is_admin_revenda() AND revenda_id IN (SELECT revenda_id FROM perfis WHERE id = auth.uid())
);
CREATE POLICY "Admin revenda gerencia vouchers" ON vouchers FOR ALL USING (
  is_admin_revenda() AND revenda_id IN (SELECT revenda_id FROM perfis WHERE id = auth.uid())
);

-- Políticas para ENQUETES
CREATE POLICY "Admin geral vê todas enquetes" ON enquetes FOR SELECT USING (is_admin_geral());
CREATE POLICY "Admin revenda vê enquetes da revenda" ON enquetes FOR SELECT USING (
  is_admin_revenda() AND revenda_id IN (SELECT revenda_id FROM perfis WHERE id = auth.uid())
);
CREATE POLICY "Admin revenda gerencia enquetes" ON enquetes FOR ALL USING (
  is_admin_revenda() AND revenda_id IN (SELECT revenda_id FROM perfis WHERE id = auth.uid())
);
CREATE POLICY "Todos veem enquetes ativas" ON enquetes FOR SELECT USING (status = 'ativa');

-- Políticas para QUESTÕES DE ENQUETES
CREATE POLICY "Todos veem questões de enquetes ativas" ON questoes_enquetes FOR SELECT USING (
  EXISTS (SELECT 1 FROM enquetes WHERE id = enquete_id AND status = 'ativa')
);

-- Políticas para RESPOSTAS DE ENQUETES
CREATE POLICY "Usuário vê próprias respostas" ON respostas_enquetes FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "Todos podem responder enquetes" ON respostas_enquetes FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin revenda vê respostas da revenda" ON respostas_enquetes FOR SELECT USING (
  is_admin_revenda() AND enquete_id IN (
    SELECT id FROM enquetes WHERE revenda_id IN (SELECT revenda_id FROM perfis WHERE id = auth.uid())
  )
);

-- Políticas para GAMIFICAÇÃO
CREATE POLICY "Todos veem gamificação ativa" ON gamificacao FOR SELECT USING (status = 'ativa');
CREATE POLICY "Admin revenda gerencia gamificação" ON gamificacao FOR ALL USING (
  is_admin_revenda() AND revenda_id IN (SELECT revenda_id FROM perfis WHERE id = auth.uid())
);

-- Políticas para PONTOS DE USUÁRIOS
CREATE POLICY "Usuário vê próprios pontos" ON pontos_usuarios FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "Sistema atualiza pontos" ON pontos_usuarios FOR ALL USING (true);

-- Políticas para LOGS DE ATIVIDADES
CREATE POLICY "Admin geral vê todos logs" ON logs_atividades FOR SELECT USING (is_admin_geral());
CREATE POLICY "Admin revenda vê logs da revenda" ON logs_atividades FOR SELECT USING (
  is_admin_revenda() AND revenda_id IN (SELECT revenda_id FROM perfis WHERE id = auth.uid())
);
CREATE POLICY "Sistema insere logs" ON logs_atividades FOR INSERT WITH CHECK (true);

-- Políticas para MÉTRICAS DE USO
CREATE POLICY "Admin geral vê todas métricas" ON metricas_uso FOR SELECT USING (is_admin_geral());
CREATE POLICY "Admin revenda vê métricas da revenda" ON metricas_uso FOR SELECT USING (
  is_admin_revenda() AND revenda_id IN (SELECT revenda_id FROM perfis WHERE id = auth.uid())
);

-- =====================================================
-- PARTE 5: TRIGGERS E FUNÇÕES AUTOMÁTICAS
-- =====================================================

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION criar_perfil_automatico()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfis (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_criar_perfil
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION criar_perfil_automatico();

-- Trigger para criar pontos de usuário automaticamente
CREATE OR REPLACE FUNCTION criar_pontos_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pontos_usuarios (usuario_id, pontos_totais, nivel)
  VALUES (NEW.id, 0, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_criar_pontos
  AFTER INSERT ON perfis
  FOR EACH ROW
  EXECUTE FUNCTION criar_pontos_usuario();

-- Trigger para atualizar timestamp de atualização
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_revendas
  BEFORE UPDATE ON revendas
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_atualizar_perfis
  BEFORE UPDATE ON perfis
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_atualizar_hotspots
  BEFORE UPDATE ON hotspots
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_atualizar_campanhas
  BEFORE UPDATE ON campanhas
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp();

-- Função para incrementar respostas de enquete
CREATE OR REPLACE FUNCTION incrementar_respostas_enquete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE enquetes
  SET total_respostas = total_respostas + 1
  WHERE id = NEW.enquete_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_incrementar_respostas
  AFTER INSERT ON respostas_enquetes
  FOR EACH ROW
  EXECUTE FUNCTION incrementar_respostas_enquete();

-- =====================================================
-- PARTE 6: DADOS DE SEED (EXEMPLOS)
-- =====================================================

-- Inserir planos padrão
INSERT INTO planos (nome, descricao, preco_mensal, limite_clientes, limite_hotspots, limite_usuarios_simultaneos) VALUES
('Básico', 'Plano ideal para começar', 29.90, 5, 2, 50),
('Profissional', 'Para empresas em crescimento', 79.90, 20, 10, 200),
('Enterprise', 'Solução completa para grandes empresas', 199.90, 100, 50, 1000);

-- Inserir revenda de exemplo
INSERT INTO revendas (nome, dominio, plano_id, limite_clientes, limite_hotspots) 
SELECT 
  'Revenda Demo',
  'demo.hotspot360.com',
  id,
  10,
  5
FROM planos WHERE nome = 'Profissional' LIMIT 1;

-- Inserir dados de exemplo para gamificação
INSERT INTO gamificacao (nome, tipo, descricao, pontos, revenda_id) 
SELECT 
  'Primeira Conexão',
  'conquista',
  'Conecte-se pela primeira vez',
  10,
  id
FROM revendas WHERE nome = 'Revenda Demo' LIMIT 1;

INSERT INTO gamificacao (nome, tipo, descricao, pontos, revenda_id) 
SELECT 
  'Usuário Frequente',
  'conquista',
  'Conecte-se 10 vezes',
  50,
  id
FROM revendas WHERE nome = 'Revenda Demo' LIMIT 1;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
