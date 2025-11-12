-- Tabela para armazenar configurações de integrações
CREATE TABLE IF NOT EXISTS integracoes_revenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'whatsapp', 'sms', 'crm', 'webhook', 'automation'
  nome VARCHAR(255) NOT NULL,
  provider VARCHAR(100), -- 'twilio', 'hubspot', 'zapier', 'n8n', etc.
  configuracoes JSONB NOT NULL DEFAULT '{}', -- Armazena credenciais e configs
  ativo BOOLEAN DEFAULT true,
  testado_em TIMESTAMP WITH TIME ZONE,
  teste_sucesso BOOLEAN,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_por UUID REFERENCES usuarios(id),
  UNIQUE(revenda_id, tipo, provider)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_integracoes_revenda_id ON integracoes_revenda(revenda_id);
CREATE INDEX IF NOT EXISTS idx_integracoes_tipo ON integracoes_revenda(tipo);
CREATE INDEX IF NOT EXISTS idx_integracoes_ativo ON integracoes_revenda(ativo);

-- Tabela para logs de webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integracao_id UUID REFERENCES integracoes_revenda(id) ON DELETE CASCADE,
  revenda_id UUID NOT NULL REFERENCES revendas(id) ON DELETE CASCADE,
  evento VARCHAR(100) NOT NULL,
  payload JSONB,
  resposta JSONB,
  status_code INTEGER,
  sucesso BOOLEAN,
  erro TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_integracao ON webhook_logs(integracao_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_revenda ON webhook_logs(revenda_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_criado ON webhook_logs(criado_em DESC);

-- RLS
ALTER TABLE integracoes_revenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policies para integracoes_revenda
CREATE POLICY "Revendas podem ver suas integrações"
  ON integracoes_revenda FOR SELECT
  USING (revenda_id IN (
    SELECT revenda_id FROM usuarios WHERE id = auth.uid()
  ));

CREATE POLICY "Revendas podem inserir suas integrações"
  ON integracoes_revenda FOR INSERT
  WITH CHECK (revenda_id IN (
    SELECT revenda_id FROM usuarios WHERE id = auth.uid()
  ));

CREATE POLICY "Revendas podem atualizar suas integrações"
  ON integracoes_revenda FOR UPDATE
  USING (revenda_id IN (
    SELECT revenda_id FROM usuarios WHERE id = auth.uid()
  ));

CREATE POLICY "Revendas podem deletar suas integrações"
  ON integracoes_revenda FOR DELETE
  USING (revenda_id IN (
    SELECT revenda_id FROM usuarios WHERE id = auth.uid()
  ));

-- Policies para webhook_logs
CREATE POLICY "Revendas podem ver seus logs de webhook"
  ON webhook_logs FOR SELECT
  USING (revenda_id IN (
    SELECT revenda_id FROM usuarios WHERE id = auth.uid()
  ));
