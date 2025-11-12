-- Adiciona suporte para integração com Mikrotik
-- Permite que cada cliente configure seu próprio roteador Mikrotik

-- Adicionar colunas de configuração Mikrotik na tabela clientes
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS mikrotik_host VARCHAR(255),
ADD COLUMN IF NOT EXISTS mikrotik_username VARCHAR(100),
ADD COLUMN IF NOT EXISTS mikrotik_password VARCHAR(255),
ADD COLUMN IF NOT EXISTS mikrotik_hotspot_name VARCHAR(100) DEFAULT 'hotspot1',
ADD COLUMN IF NOT EXISTS mikrotik_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN clientes.mikrotik_host IS 'IP ou hostname do roteador Mikrotik';
COMMENT ON COLUMN clientes.mikrotik_username IS 'Usuário admin do Mikrotik';
COMMENT ON COLUMN clientes.mikrotik_password IS 'Senha do admin do Mikrotik';
COMMENT ON COLUMN clientes.mikrotik_hotspot_name IS 'Nome do hotspot configurado no Mikrotik';
COMMENT ON COLUMN clientes.mikrotik_enabled IS 'Se a integração com Mikrotik está ativa';
