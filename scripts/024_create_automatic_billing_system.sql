-- Sistema de Faturamento Automático
-- Cria tabelas e triggers para geração automática de faturas

-- Tabela de faturas
CREATE TABLE IF NOT EXISTS faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plano_id UUID REFERENCES planos(id),
  
  -- Dados da fatura
  numero_fatura VARCHAR(50) UNIQUE NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  desconto DECIMAL(10, 2) DEFAULT 0,
  valor_final DECIMAL(10, 2) NOT NULL,
  
  -- Datas
  data_emissao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_vencimento DATE NOT NULL,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  
  -- Status e pagamento
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'vencida', 'cancelada')),
  metodo_pagamento VARCHAR(20) CHECK (metodo_pagamento IN ('pix', 'boleto', 'cartao', 'transferencia')),
  
  -- Dados de pagamento
  pix_qrcode TEXT,
  pix_copia_cola TEXT,
  boleto_url TEXT,
  boleto_codigo_barras TEXT,
  transacao_id VARCHAR(100),
  
  -- Recorrência
  recorrente BOOLEAN DEFAULT TRUE,
  periodo_cobranca VARCHAR(20) DEFAULT 'mensal' CHECK (periodo_cobranca IN ('mensal', 'trimestral', 'semestral', 'anual')),
  proxima_cobranca DATE,
  
  -- Notificações
  email_enviado BOOLEAN DEFAULT FALSE,
  whatsapp_enviado BOOLEAN DEFAULT FALSE,
  lembrete_enviado BOOLEAN DEFAULT FALSE,
  
  -- Metadados
  notas TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_faturas_revenda ON faturas(revenda_id);
CREATE INDEX IF NOT EXISTS idx_faturas_cliente ON faturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_faturas_status ON faturas(status);
CREATE INDEX IF NOT EXISTS idx_faturas_vencimento ON faturas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_faturas_numero ON faturas(numero_fatura);

-- Tabela de histórico de pagamentos
CREATE TABLE IF NOT EXISTS historico_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id UUID NOT NULL REFERENCES faturas(id) ON DELETE CASCADE,
  
  status_anterior VARCHAR(20),
  status_novo VARCHAR(20),
  valor_pago DECIMAL(10, 2),
  metodo_pagamento VARCHAR(20),
  transacao_id VARCHAR(100),
  
  comprovante_url TEXT,
  notas TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_por UUID REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_historico_fatura ON historico_pagamentos(fatura_id);

-- Tabela de configurações de cobrança por revenda
CREATE TABLE IF NOT EXISTS configuracoes_cobranca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL UNIQUE REFERENCES revendas(id) ON DELETE CASCADE,
  
  -- Configurações gerais
  dia_vencimento INTEGER DEFAULT 10 CHECK (dia_vencimento BETWEEN 1 AND 28),
  dias_aviso_vencimento INTEGER DEFAULT 3,
  dias_tolerancia INTEGER DEFAULT 5,
  
  -- Multas e juros
  multa_percentual DECIMAL(5, 2) DEFAULT 2.00,
  juros_diario DECIMAL(5, 2) DEFAULT 0.033,
  
  -- Notificações
  enviar_email BOOLEAN DEFAULT TRUE,
  enviar_whatsapp BOOLEAN DEFAULT TRUE,
  enviar_lembrete BOOLEAN DEFAULT TRUE,
  
  -- Gateway de pagamento
  gateway_pix_ativo BOOLEAN DEFAULT TRUE,
  gateway_boleto_ativo BOOLEAN DEFAULT TRUE,
  gateway_cartao_ativo BOOLEAN DEFAULT FALSE,
  
  gateway_api_key TEXT,
  gateway_api_secret TEXT,
  gateway_webhook_url TEXT,
  
  -- Templates de mensagem
  template_email_fatura TEXT,
  template_whatsapp_fatura TEXT,
  template_lembrete TEXT,
  
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para gerar número de fatura
CREATE OR REPLACE FUNCTION gerar_numero_fatura(p_revenda_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_contador INTEGER;
  v_ano VARCHAR(4);
  v_mes VARCHAR(2);
  v_numero VARCHAR(50);
BEGIN
  v_ano := TO_CHAR(NOW(), 'YYYY');
  v_mes := TO_CHAR(NOW(), 'MM');
  
  -- Conta faturas do mês atual
  SELECT COUNT(*) + 1 INTO v_contador
  FROM faturas
  WHERE revenda_id = p_revenda_id
    AND EXTRACT(YEAR FROM criado_em) = EXTRACT(YEAR FROM NOW())
    AND EXTRACT(MONTH FROM criado_em) = EXTRACT(MONTH FROM NOW());
  
  v_numero := 'FAT-' || v_ano || v_mes || '-' || LPAD(v_contador::TEXT, 4, '0');
  
  RETURN v_numero;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular próxima data de cobrança
CREATE OR REPLACE FUNCTION calcular_proxima_cobranca(
  p_data_atual DATE,
  p_periodo VARCHAR
)
RETURNS DATE AS $$
BEGIN
  RETURN CASE p_periodo
    WHEN 'mensal' THEN p_data_atual + INTERVAL '1 month'
    WHEN 'trimestral' THEN p_data_atual + INTERVAL '3 months'
    WHEN 'semestral' THEN p_data_atual + INTERVAL '6 months'
    WHEN 'anual' THEN p_data_atual + INTERVAL '1 year'
    ELSE p_data_atual + INTERVAL '1 month'
  END;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION update_faturas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_faturas_timestamp
BEFORE UPDATE ON faturas
FOR EACH ROW
EXECUTE FUNCTION update_faturas_timestamp();

-- Trigger para registrar histórico de pagamento
CREATE OR REPLACE FUNCTION registrar_historico_pagamento()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO historico_pagamentos (
      fatura_id,
      status_anterior,
      status_novo,
      valor_pago,
      metodo_pagamento,
      transacao_id
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.valor_final,
      NEW.metodo_pagamento,
      NEW.transacao_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_historico_pagamento
AFTER UPDATE ON faturas
FOR EACH ROW
EXECUTE FUNCTION registrar_historico_pagamento();

-- Trigger para marcar faturas vencidas
CREATE OR REPLACE FUNCTION marcar_faturas_vencidas()
RETURNS void AS $$
BEGIN
  UPDATE faturas
  SET status = 'vencida'
  WHERE status = 'pendente'
    AND data_vencimento < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar faturas mensais automaticamente
CREATE OR REPLACE FUNCTION gerar_faturas_mensais()
RETURNS void AS $$
DECLARE
  v_cliente RECORD;
  v_config RECORD;
  v_numero_fatura VARCHAR(50);
  v_data_vencimento DATE;
BEGIN
  -- Para cada cliente ativo com plano
  FOR v_cliente IN
    SELECT u.id, u.revenda_id, u.plano_id, u.nome_completo, u.email,
           p.nome as plano_nome, p.preco_mensal
    FROM usuarios u
    JOIN planos p ON u.plano_id = p.id
    WHERE u.ativo = TRUE
      AND u.role = 'cliente'
      AND u.plano_id IS NOT NULL
      -- Verifica se não tem fatura pendente do mês atual
      AND NOT EXISTS (
        SELECT 1 FROM faturas f
        WHERE f.cliente_id = u.id
          AND f.status IN ('pendente', 'paga')
          AND EXTRACT(YEAR FROM f.data_emissao) = EXTRACT(YEAR FROM NOW())
          AND EXTRACT(MONTH FROM f.data_emissao) = EXTRACT(MONTH FROM NOW())
      )
  LOOP
    -- Busca configurações de cobrança da revenda
    SELECT * INTO v_config
    FROM configuracoes_cobranca
    WHERE revenda_id = v_cliente.revenda_id;
    
    -- Define data de vencimento
    v_data_vencimento := DATE_TRUNC('month', NOW()) + 
                         INTERVAL '1 month' - INTERVAL '1 day' +
                         COALESCE(v_config.dia_vencimento, 10) * INTERVAL '1 day';
    
    -- Gera número da fatura
    v_numero_fatura := gerar_numero_fatura(v_cliente.revenda_id);
    
    -- Cria a fatura
    INSERT INTO faturas (
      revenda_id,
      cliente_id,
      plano_id,
      numero_fatura,
      descricao,
      valor,
      valor_final,
      data_vencimento,
      recorrente,
      proxima_cobranca
    ) VALUES (
      v_cliente.revenda_id,
      v_cliente.id,
      v_cliente.plano_id,
      v_numero_fatura,
      'Mensalidade ' || v_cliente.plano_nome || ' - ' || TO_CHAR(NOW(), 'MM/YYYY'),
      v_cliente.preco_mensal,
      v_cliente.preco_mensal,
      v_data_vencimento,
      TRUE,
      calcular_proxima_cobranca(v_data_vencimento, 'mensal')
    );
    
    RAISE NOTICE 'Fatura % gerada para cliente %', v_numero_fatura, v_cliente.nome_completo;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS
ALTER TABLE faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_cobranca ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para faturas
CREATE POLICY "Revendas podem ver suas faturas"
  ON faturas FOR SELECT
  USING (
    revenda_id IN (
      SELECT revenda_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "Revendas podem criar faturas"
  ON faturas FOR INSERT
  WITH CHECK (
    revenda_id IN (
      SELECT revenda_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "Revendas podem atualizar suas faturas"
  ON faturas FOR UPDATE
  USING (
    revenda_id IN (
      SELECT revenda_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- Inserir configurações padrão para revendas existentes
INSERT INTO configuracoes_cobranca (revenda_id)
SELECT id FROM revendas
ON CONFLICT (revenda_id) DO NOTHING;

-- Comentários
COMMENT ON TABLE faturas IS 'Armazena todas as faturas geradas automaticamente para clientes';
COMMENT ON TABLE historico_pagamentos IS 'Histórico de mudanças de status e pagamentos das faturas';
COMMENT ON TABLE configuracoes_cobranca IS 'Configurações de cobrança personalizadas por revenda';
COMMENT ON FUNCTION gerar_faturas_mensais() IS 'Gera faturas mensais automaticamente para todos os clientes ativos';
