-- Script completo para estrutura do painel de revenda
-- Inclui: limites, planos detalhados, hotspots, faturas, equipe, logs de auditoria

-- 1) Atualizar tabela de planos com recursos detalhados
ALTER TABLE planos ADD COLUMN IF NOT EXISTS recursos JSONB DEFAULT '{
  "hotspots_max": 10,
  "usuarios_simultaneos_max": 100,
  "campanhas_max": 5,
  "midia_mb_mes": 1000,
  "sms_mes": 100,
  "whatsapp_mes": 100,
  "storage_gb": 5,
  "login_social": true,
  "voucher": true,
  "enquetes": true,
  "cupons": false,
  "lpr_ocr": false,
  "api_access": false
}'::jsonb;

ALTER TABLE planos ADD COLUMN IF NOT EXISTS preco_mensal DECIMAL(10,2) DEFAULT 0;
ALTER TABLE planos ADD COLUMN IF NOT EXISTS preco_anual DECIMAL(10,2) DEFAULT 0;
ALTER TABLE planos ADD COLUMN IF NOT EXISTS tipo_cobranca TEXT DEFAULT 'mensal' CHECK (tipo_cobranca IN ('mensal', 'anual', 'pay_per_use'));

-- 2) Criar tabela de hotspots por cliente
CREATE TABLE IF NOT EXISTS hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ssid TEXT NOT NULL,
  local TEXT,
  endereco TEXT,
  tipo_controlador TEXT DEFAULT 'mikrotik' CHECK (tipo_controlador IN ('mikrotik', 'unifi', 'radius', 'outro')),
  ip_controlador TEXT,
  porta INTEGER DEFAULT 8728,
  usuario_api TEXT,
  senha_api_hash TEXT,
  radius_secret TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'manutencao', 'offline')),
  ultimo_ping TIMESTAMPTZ,
  configuracoes JSONB DEFAULT '{
    "tempo_sessao_min": 60,
    "banda_download_mbps": 10,
    "banda_upload_mbps": 5,
    "usuarios_simultaneos": 50,
    "walled_garden": []
  }'::jsonb,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hotspots_cliente ON hotspots(cliente_id);
CREATE INDEX idx_hotspots_revenda ON hotspots(revenda_id);
CREATE INDEX idx_hotspots_status ON hotspots(status);

-- 3) Criar tabela de faturas
CREATE TABLE IF NOT EXISTS faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plano_id UUID REFERENCES planos(id),
  numero_fatura TEXT UNIQUE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  desconto DECIMAL(10,2) DEFAULT 0,
  valor_final DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'vencida', 'cancelada')),
  metodo_pagamento TEXT CHECK (metodo_pagamento IN ('boleto', 'pix', 'cartao', 'transferencia')),
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  link_boleto TEXT,
  pix_qrcode TEXT,
  pix_copia_cola TEXT,
  nfe_numero TEXT,
  nfe_url TEXT,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_faturas_revenda ON faturas(revenda_id);
CREATE INDEX idx_faturas_cliente ON faturas(cliente_id);
CREATE INDEX idx_faturas_status ON faturas(status);
CREATE INDEX idx_faturas_vencimento ON faturas(data_vencimento);

-- 4) Criar tabela de equipe da revenda (usuários internos)
CREATE TABLE IF NOT EXISTS equipe_revenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  papel TEXT NOT NULL CHECK (papel IN ('admin', 'comercial', 'suporte', 'financeiro', 'operador')),
  permissoes JSONB DEFAULT '{
    "clientes": {"ver": true, "criar": false, "editar": false, "excluir": false},
    "hotspots": {"ver": true, "criar": false, "editar": false, "excluir": false},
    "campanhas": {"ver": true, "criar": false, "editar": false, "excluir": false},
    "financeiro": {"ver": false, "criar": false, "editar": false, "excluir": false},
    "relatorios": {"ver": true, "exportar": false},
    "configuracoes": {"ver": false, "editar": false}
  }'::jsonb,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(revenda_id, usuario_id)
);

CREATE INDEX idx_equipe_revenda ON equipe_revenda(revenda_id);
CREATE INDEX idx_equipe_usuario ON equipe_revenda(usuario_id);

-- 5) Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID REFERENCES revendas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_origem TEXT,
  user_agent TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_revenda ON logs_auditoria(revenda_id);
CREATE INDEX idx_logs_usuario ON logs_auditoria(usuario_id);
CREATE INDEX idx_logs_criado ON logs_auditoria(criado_em DESC);
CREATE INDEX idx_logs_entidade ON logs_auditoria(entidade, entidade_id);

-- 6) Criar tabela de sessões de usuários (conexões Wi-Fi)
CREATE TABLE IF NOT EXISTS sessoes_wifi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotspot_id UUID NOT NULL REFERENCES hotspots(id) ON DELETE CASCADE,
  usuario_social_id UUID REFERENCES usuarios_social(id) ON DELETE SET NULL,
  mac_address TEXT NOT NULL,
  ip_address TEXT,
  inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fim TIMESTAMPTZ,
  duracao_segundos INTEGER,
  bytes_download BIGINT DEFAULT 0,
  bytes_upload BIGINT DEFAULT 0,
  metodo_autenticacao TEXT CHECK (metodo_autenticacao IN ('social', 'voucher', 'email', 'sms', 'livre')),
  dispositivo TEXT,
  navegador TEXT,
  sistema_operacional TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessoes_hotspot ON sessoes_wifi(hotspot_id);
CREATE INDEX idx_sessoes_usuario_social ON sessoes_wifi(usuario_social_id);
CREATE INDEX idx_sessoes_inicio ON sessoes_wifi(inicio DESC);
CREATE INDEX idx_sessoes_mac ON sessoes_wifi(mac_address);

-- 7) Criar tabela de limites de uso por cliente
CREATE TABLE IF NOT EXISTS limites_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plano_id UUID REFERENCES planos(id),
  hotspots_usados INTEGER DEFAULT 0,
  hotspots_max INTEGER DEFAULT 10,
  usuarios_simultaneos_atual INTEGER DEFAULT 0,
  usuarios_simultaneos_max INTEGER DEFAULT 100,
  campanhas_usadas INTEGER DEFAULT 0,
  campanhas_max INTEGER DEFAULT 5,
  midia_mb_usado DECIMAL(10,2) DEFAULT 0,
  midia_mb_max DECIMAL(10,2) DEFAULT 1000,
  sms_enviados INTEGER DEFAULT 0,
  sms_max INTEGER DEFAULT 100,
  whatsapp_enviados INTEGER DEFAULT 0,
  whatsapp_max INTEGER DEFAULT 100,
  storage_gb_usado DECIMAL(10,2) DEFAULT 0,
  storage_gb_max DECIMAL(10,2) DEFAULT 5,
  periodo_inicio DATE DEFAULT CURRENT_DATE,
  periodo_fim DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cliente_id)
);

CREATE INDEX idx_limites_cliente ON limites_cliente(cliente_id);

-- 8) Atualizar planos existentes com valores
UPDATE planos SET 
  preco_mensal = CASE 
    WHEN nome = 'Básico' THEN 99.90
    WHEN nome = 'Profissional' THEN 299.90
    WHEN nome = 'Enterprise' THEN 999.90
    ELSE 0
  END,
  preco_anual = CASE 
    WHEN nome = 'Básico' THEN 999.00
    WHEN nome = 'Profissional' THEN 2999.00
    WHEN nome = 'Enterprise' THEN 9999.00
    ELSE 0
  END,
  recursos = CASE 
    WHEN nome = 'Básico' THEN '{
      "hotspots_max": 5,
      "usuarios_simultaneos_max": 50,
      "campanhas_max": 3,
      "midia_mb_mes": 500,
      "sms_mes": 50,
      "whatsapp_mes": 50,
      "storage_gb": 2,
      "login_social": true,
      "voucher": true,
      "enquetes": true,
      "cupons": false,
      "lpr_ocr": false,
      "api_access": false
    }'::jsonb
    WHEN nome = 'Profissional' THEN '{
      "hotspots_max": 20,
      "usuarios_simultaneos_max": 200,
      "campanhas_max": 10,
      "midia_mb_mes": 2000,
      "sms_mes": 200,
      "whatsapp_mes": 200,
      "storage_gb": 10,
      "login_social": true,
      "voucher": true,
      "enquetes": true,
      "cupons": true,
      "lpr_ocr": false,
      "api_access": true
    }'::jsonb
    WHEN nome = 'Enterprise' THEN '{
      "hotspots_max": 100,
      "usuarios_simultaneos_max": 1000,
      "campanhas_max": 50,
      "midia_mb_mes": 10000,
      "sms_mes": 1000,
      "whatsapp_mes": 1000,
      "storage_gb": 50,
      "login_social": true,
      "voucher": true,
      "enquetes": true,
      "cupons": true,
      "lpr_ocr": true,
      "api_access": true
    }'::jsonb
    ELSE recursos
  END
WHERE nome IN ('Básico', 'Profissional', 'Enterprise');

-- 9) Função para atualizar limites automaticamente
CREATE OR REPLACE FUNCTION atualizar_limites_cliente()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar contadores quando hotspot é criado/deletado
  IF TG_TABLE_NAME = 'hotspots' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE limites_cliente 
      SET hotspots_usados = hotspots_usados + 1
      WHERE cliente_id = NEW.cliente_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE limites_cliente 
      SET hotspots_usados = GREATEST(0, hotspots_usados - 1)
      WHERE cliente_id = OLD.cliente_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_limites_hotspots
AFTER INSERT OR DELETE ON hotspots
FOR EACH ROW EXECUTE FUNCTION atualizar_limites_cliente();

-- 10) Inserir dados de exemplo para testes
-- (Será preenchido quando houver clientes reais)

COMMENT ON TABLE hotspots IS 'Hotspots Wi-Fi gerenciados por cada cliente';
COMMENT ON TABLE faturas IS 'Faturas e cobranças dos clientes';
COMMENT ON TABLE equipe_revenda IS 'Equipe interna da revenda com permissões';
COMMENT ON TABLE logs_auditoria IS 'Logs de auditoria de todas as ações no sistema';
COMMENT ON TABLE sessoes_wifi IS 'Sessões de conexão Wi-Fi dos usuários finais';
COMMENT ON TABLE limites_cliente IS 'Controle de limites e uso por cliente';
