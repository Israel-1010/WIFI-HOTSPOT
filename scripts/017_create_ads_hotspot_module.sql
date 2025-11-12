CREATE TABLE IF NOT EXISTS anuncios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  video_url TEXT,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('imagem', 'video', 'html')),
  conteudo_html TEXT,
  cta_texto_sim TEXT DEFAULT 'Tenho interesse',
  cta_texto_nao TEXT DEFAULT 'Não tenho interesse',
  url_destino TEXT,
  tempo_exibicao INTEGER DEFAULT 30, -- segundos
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_fim TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interacoes_anuncios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anuncio_id UUID NOT NULL REFERENCES anuncios(id) ON DELETE CASCADE,
  usuario_social_id UUID REFERENCES usuarios_social(id) ON DELETE SET NULL,
  sessao_id UUID REFERENCES sessoes_social(id) ON DELETE SET NULL,
  resposta VARCHAR(10) NOT NULL CHECK (resposta IN ('sim', 'nao')),
  ip_address INET,
  user_agent TEXT,
  hotspot_id UUID REFERENCES hotspots(id) ON DELETE SET NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campanhas_marketing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('email', 'sms', 'push', 'enquete')),
  status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'agendada', 'ativa', 'pausada', 'concluida')),
  
  -- Segmentação
  filtro_genero VARCHAR(20), -- 'masculino', 'feminino', 'outro'
  filtro_idade_min INTEGER,
  filtro_idade_max INTEGER,
  filtro_interesse VARCHAR(10), -- 'sim', 'nao', 'todos'
  filtro_anuncio_ids UUID[], -- IDs dos anúncios para filtrar
  
  -- Conteúdo da campanha
  assunto TEXT,
  mensagem TEXT,
  template_html TEXT,
  
  -- Agendamento
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_fim TIMESTAMP WITH TIME ZONE,
  
  -- Métricas
  total_enviados INTEGER DEFAULT 0,
  total_abertos INTEGER DEFAULT 0,
  total_cliques INTEGER DEFAULT 0,
  
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS envios_campanha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID NOT NULL REFERENCES campanhas_marketing(id) ON DELETE CASCADE,
  usuario_social_id UUID NOT NULL REFERENCES usuarios_social(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'aberto', 'clicado', 'erro')),
  enviado_em TIMESTAMP WITH TIME ZONE,
  aberto_em TIMESTAMP WITH TIME ZONE,
  clicado_em TIMESTAMP WITH TIME ZONE,
  erro_mensagem TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configuracoes_portal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Slideshow inicial
  slideshow_ativo BOOLEAN DEFAULT true,
  slideshow_tempo_minimo INTEGER DEFAULT 30, -- segundos
  slideshow_imagens TEXT[], -- URLs das imagens
  slideshow_videos TEXT[], -- URLs dos vídeos
  
  -- Autenticação
  auth_social_ativo BOOLEAN DEFAULT true,
  auth_email_ativo BOOLEAN DEFAULT true,
  auth_voucher_ativo BOOLEAN DEFAULT false,
  
  -- Anúncios
  anuncios_obrigatorios BOOLEAN DEFAULT true,
  anuncios_por_sessao INTEGER DEFAULT 1,
  
  -- Personalização
  logo_url TEXT,
  cor_primaria TEXT DEFAULT '#3b82f6',
  cor_secundaria TEXT DEFAULT '#1e40af',
  mensagem_boas_vindas TEXT DEFAULT 'Bem-vindo! Conecte-se ao Wi-Fi gratuito',
  mensagem_agradecimento TEXT DEFAULT 'Obrigado pelo seu interesse!',
  
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cliente_id)
);

-- Índices para performance
CREATE INDEX idx_anuncios_cliente ON anuncios(cliente_id);
CREATE INDEX idx_anuncios_ativo ON anuncios(ativo);
CREATE INDEX idx_interacoes_anuncio ON interacoes_anuncios(anuncio_id);
CREATE INDEX idx_interacoes_usuario ON interacoes_anuncios(usuario_social_id);
CREATE INDEX idx_interacoes_resposta ON interacoes_anuncios(resposta);
CREATE INDEX idx_campanhas_cliente ON campanhas_marketing(cliente_id);
CREATE INDEX idx_campanhas_status ON campanhas_marketing(status);
CREATE INDEX idx_envios_campanha ON envios_campanha(campanha_id);
CREATE INDEX idx_envios_usuario ON envios_campanha(usuario_social_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_anuncios_updated_at BEFORE UPDATE ON anuncios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campanhas_updated_at BEFORE UPDATE ON campanhas_marketing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_portal_updated_at BEFORE UPDATE ON configuracoes_portal
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração padrão para clientes existentes
INSERT INTO configuracoes_portal (cliente_id)
SELECT id FROM usuarios WHERE role = 'cliente'
ON CONFLICT (cliente_id) DO NOTHING;

COMMENT ON TABLE anuncios IS 'Anúncios exibidos no portal de conexão Wi-Fi';
COMMENT ON TABLE interacoes_anuncios IS 'Registro de interações dos usuários com os anúncios';
COMMENT ON TABLE campanhas_marketing IS 'Campanhas de marketing segmentadas baseadas em dados coletados';
COMMENT ON TABLE envios_campanha IS 'Registro de envios individuais de campanhas';
COMMENT ON TABLE configuracoes_portal IS 'Configurações do portal de conexão para cada cliente';
