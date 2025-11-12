-- Criar tabela de configurações do portal
CREATE TABLE IF NOT EXISTS portal_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Informações gerais
  business_name TEXT NOT NULL DEFAULT 'Meu Negócio',
  welcome_message TEXT NOT NULL DEFAULT 'Bem-vindo ao nosso Wi-Fi!',
  ssid TEXT NOT NULL DEFAULT 'WiFi-Gratis',
  logo_url TEXT,
  
  -- Cores e design
  brand_color TEXT NOT NULL DEFAULT '#2563eb',
  background_color TEXT NOT NULL DEFAULT '#f8fafc',
  text_color TEXT NOT NULL DEFAULT '#1f2937',
  secondary_text_color TEXT NOT NULL DEFAULT '#6b7280',
  title_size TEXT NOT NULL DEFAULT 'text-xl',
  card_style TEXT NOT NULL DEFAULT 'rounded-lg',
  
  -- Métodos de login
  login_voucher BOOLEAN NOT NULL DEFAULT true,
  login_facebook BOOLEAN NOT NULL DEFAULT true,
  login_google BOOLEAN NOT NULL DEFAULT true,
  login_instagram BOOLEAN NOT NULL DEFAULT false,
  login_whatsapp BOOLEAN NOT NULL DEFAULT false,
  login_email BOOLEAN NOT NULL DEFAULT false,
  login_phone BOOLEAN NOT NULL DEFAULT false,
  login_user_password BOOLEAN NOT NULL DEFAULT false,
  
  -- Configurações de conteúdo
  terms_required BOOLEAN NOT NULL DEFAULT true,
  show_campaigns BOOLEAN NOT NULL DEFAULT true,
  campaign_timing TEXT NOT NULL DEFAULT 'before', -- before, after
  show_surveys BOOLEAN NOT NULL DEFAULT true,
  survey_timing TEXT NOT NULL DEFAULT 'after', -- before, after
  
  -- Metadados
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(cliente_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_portal_config_cliente ON portal_config(cliente_id);

-- RLS
ALTER TABLE portal_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver suas próprias configurações"
  ON portal_config FOR SELECT
  USING (cliente_id = auth.uid() OR cliente_id IN (
    SELECT id FROM usuarios WHERE revenda_id = (
      SELECT revenda_id FROM usuarios WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Usuários podem inserir suas próprias configurações"
  ON portal_config FOR INSERT
  WITH CHECK (cliente_id = auth.uid());

CREATE POLICY "Usuários podem atualizar suas próprias configurações"
  ON portal_config FOR UPDATE
  USING (cliente_id = auth.uid());

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_portal_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER portal_config_updated_at
  BEFORE UPDATE ON portal_config
  FOR EACH ROW
  EXECUTE FUNCTION update_portal_config_updated_at();
