-- Adiciona coluna CNPJ nas tabelas revendas e usuarios

-- Adicionar CNPJ na tabela revendas
ALTER TABLE revendas 
ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18) UNIQUE;

-- Adicionar índice para CNPJ em revendas
CREATE INDEX IF NOT EXISTS idx_revendas_cnpj ON revendas(cnpj);

-- Adicionar CNPJ na tabela usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);

-- Adicionar índice para CNPJ em usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_cnpj ON usuarios(cnpj);

-- Adicionar comentários
COMMENT ON COLUMN revendas.cnpj IS 'CNPJ da revenda (formato: 00.000.000/0000-00)';
COMMENT ON COLUMN usuarios.cnpj IS 'CNPJ do usuário/cliente (formato: 00.000.000/0000-00)';
