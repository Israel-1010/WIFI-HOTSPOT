-- Adicionar colunas faltantes na tabela revendas (se não existirem)
ALTER TABLE revendas 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS telefone VARCHAR(20),
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado VARCHAR(2),
ADD COLUMN IF NOT EXISTS cep VARCHAR(10);

-- Adicionar coluna plano_id na tabela usuarios (para clientes)
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS plano_id UUID REFERENCES planos(id);

-- Criar índice para busca por domínio
CREATE INDEX IF NOT EXISTS idx_revendas_dominio ON revendas(dominio);

-- Inserir planos padrão se não existirem
INSERT INTO planos (id, nome, descricao, preco_mensal, limite_clientes, limite_hotspots, limite_usuarios_simultaneos, recursos, ativo)
VALUES 
  (gen_random_uuid(), 'Básico', 'Plano básico para pequenos negócios', 99.90, 5, 3, 50, '{"suporte": "email", "relatorios": "basico"}', true),
  (gen_random_uuid(), 'Profissional', 'Plano profissional com mais recursos', 299.90, 20, 10, 200, '{"suporte": "prioritario", "relatorios": "avancado", "api": true}', true),
  (gen_random_uuid(), 'Enterprise', 'Plano enterprise com recursos ilimitados', 999.90, 100, 50, 1000, '{"suporte": "dedicado", "relatorios": "customizado", "api": true, "white_label": true}', true)
ON CONFLICT DO NOTHING;
