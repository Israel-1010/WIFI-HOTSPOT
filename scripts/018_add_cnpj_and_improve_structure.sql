-- Adicionar campo CNPJ e melhorar estrutura de revendas e clientes
-- Executar este script para adicionar campos necessários

-- Adicionar CNPJ na tabela revendas
ALTER TABLE revendas ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);
ALTER TABLE revendas ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE revendas ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
ALTER TABLE revendas ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE revendas ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);
ALTER TABLE revendas ADD COLUMN IF NOT EXISTS estado VARCHAR(2);
ALTER TABLE revendas ADD COLUMN IF NOT EXISTS cep VARCHAR(10);

-- Adicionar CNPJ na tabela usuarios (para clientes que são empresas)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS empresa VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco TEXT;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_revendas_cnpj ON revendas(cnpj);
CREATE INDEX IF NOT EXISTS idx_revendas_dominio ON revendas(dominio);
CREATE INDEX IF NOT EXISTS idx_usuarios_cnpj ON usuarios(cnpj);
CREATE INDEX IF NOT EXISTS idx_usuarios_revenda_id ON usuarios(revenda_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_cliente_id ON usuarios(cliente_id);

-- Adicionar constraint para garantir CNPJ único
ALTER TABLE revendas ADD CONSTRAINT unique_revenda_cnpj UNIQUE (cnpj);
ALTER TABLE revendas ADD CONSTRAINT unique_revenda_dominio UNIQUE (dominio);

COMMENT ON COLUMN revendas.cnpj IS 'CNPJ da revenda (formato: 00.000.000/0000-00)';
COMMENT ON COLUMN revendas.dominio IS 'Domínio personalizado da revenda para acesso white label';
COMMENT ON COLUMN usuarios.cnpj IS 'CNPJ do cliente (quando for empresa)';
COMMENT ON COLUMN usuarios.empresa IS 'Nome da empresa do cliente';
