-- Adiciona campo faixa_etaria na tabela usuarios_social
ALTER TABLE usuarios_social
ADD COLUMN IF NOT EXISTS faixa_etaria TEXT;

-- Adiciona campo data_nascimento para cálculo automático
ALTER TABLE usuarios_social
ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- Adiciona campo genero
ALTER TABLE usuarios_social
ADD COLUMN IF NOT EXISTS genero TEXT;

-- Adiciona índice para melhorar performance de queries por faixa etária
CREATE INDEX IF NOT EXISTS idx_usuarios_social_faixa_etaria ON usuarios_social(faixa_etaria);

-- Adiciona índice para melhorar performance de queries por provider
CREATE INDEX IF NOT EXISTS idx_usuarios_social_provider ON usuarios_social(provider);

-- Comentários explicativos
COMMENT ON COLUMN usuarios_social.faixa_etaria IS 'Faixa etária do usuário: 18-24, 25-34, 35-44, 45-54, 55+';
COMMENT ON COLUMN usuarios_social.data_nascimento IS 'Data de nascimento do usuário para cálculo automático da faixa etária';
COMMENT ON COLUMN usuarios_social.genero IS 'Gênero do usuário: masculino, feminino, outro, prefiro_nao_informar';
