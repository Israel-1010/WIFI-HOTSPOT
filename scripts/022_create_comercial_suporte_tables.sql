-- Criar tabela de equipe da revenda (se não existir)
CREATE TABLE IF NOT EXISTS equipe_revenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cargo TEXT NOT NULL,
  permissoes JSONB DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(revenda_id, usuario_id)
);

-- Tabelas para Suporte
CREATE TABLE IF NOT EXISTS tickets_suporte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  assunto TEXT NOT NULL,
  descricao TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('aberto', 'em_andamento', 'resolvido', 'fechado')),
  prioridade TEXT NOT NULL CHECK (prioridade IN ('baixa', 'media', 'alta')),
  categoria TEXT NOT NULL,
  atribuido_para UUID REFERENCES equipe_revenda(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS respostas_ticket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets_suporte(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  mensagem TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS base_conhecimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tags TEXT[],
  publicado BOOLEAN DEFAULT false,
  visualizacoes INTEGER DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabelas para Comercial
CREATE TABLE IF NOT EXISTS propostas_comerciais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  valor_total DECIMAL(10,2) NOT NULL,
  validade DATE,
  status TEXT NOT NULL CHECK (status IN ('rascunho', 'enviada', 'aceita', 'recusada')),
  itens JSONB,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  empresa TEXT,
  valor_estimado DECIMAL(10,2),
  estagio TEXT NOT NULL CHECK (estagio IN ('lead', 'qualificado', 'negociacao', 'convertido', 'perdido')),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_equipe_revenda ON equipe_revenda(revenda_id);
CREATE INDEX IF NOT EXISTS idx_tickets_revenda ON tickets_suporte(revenda_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets_suporte(status);
CREATE INDEX IF NOT EXISTS idx_propostas_revenda ON propostas_comerciais(revenda_id);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON propostas_comerciais(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_revenda ON pipeline_vendas(revenda_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_estagio ON pipeline_vendas(estagio);

-- RLS Policies
ALTER TABLE equipe_revenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets_suporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE base_conhecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostas_comerciais ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_vendas ENABLE ROW LEVEL SECURITY;
