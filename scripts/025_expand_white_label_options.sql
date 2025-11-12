-- Expandir opções de white label para revendas
ALTER TABLE revendas 
ADD COLUMN IF NOT EXISTS favicon_url TEXT,
ADD COLUMN IF NOT EXISTS fonte_primaria TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS fonte_secundaria TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS cor_texto TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS cor_fundo TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS cor_sidebar TEXT DEFAULT '#1e293b',
ADD COLUMN IF NOT EXISTS cor_header TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS estilo_botao TEXT DEFAULT 'rounded' CHECK (estilo_botao IN ('rounded', 'square', 'pill')),
ADD COLUMN IF NOT EXISTS tema_escuro BOOLEAN DEFAULT false;

-- Adicionar índice para busca por domínio
CREATE INDEX IF NOT EXISTS idx_revendas_dominio ON revendas(dominio);

-- Comentários
COMMENT ON COLUMN revendas.favicon_url IS 'URL do favicon personalizado da revenda';
COMMENT ON COLUMN revendas.fonte_primaria IS 'Fonte principal (títulos e destaques)';
COMMENT ON COLUMN revendas.fonte_secundaria IS 'Fonte secundária (corpo de texto)';
COMMENT ON COLUMN revendas.cor_texto IS 'Cor do texto principal';
COMMENT ON COLUMN revendas.cor_fundo IS 'Cor de fundo principal';
COMMENT ON COLUMN revendas.cor_sidebar IS 'Cor da barra lateral';
COMMENT ON COLUMN revendas.cor_header IS 'Cor do cabeçalho';
COMMENT ON COLUMN revendas.estilo_botao IS 'Estilo dos botões (rounded, square, pill)';
COMMENT ON COLUMN revendas.tema_escuro IS 'Habilitar tema escuro por padrão';
