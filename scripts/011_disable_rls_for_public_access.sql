-- Script para desabilitar RLS e permitir acesso público sem autenticação
-- Como o sistema não usa autenticação, precisamos permitir todas as operações

-- Desabilitar RLS nas tabelas principais
ALTER TABLE revendas DISABLE ROW LEVEL SECURITY;
ALTER TABLE planos DISABLE ROW LEVEL SECURITY;
ALTER TABLE perfis DISABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas DISABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE enquetes DISABLE ROW LEVEL SECURITY;
ALTER TABLE questoes_enquetes DISABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_enquetes DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamificacao DISABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs_atividades DISABLE ROW LEVEL SECURITY;
ALTER TABLE hotspots DISABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_uso DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs_acesso DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes (opcional, mas limpa o banco)
DROP POLICY IF EXISTS "Permitir todas operações" ON revendas;
DROP POLICY IF EXISTS "Permitir todas operações" ON planos;
DROP POLICY IF EXISTS "Permitir todas operações" ON perfis;
DROP POLICY IF EXISTS "Permitir todas operações" ON campanhas;
DROP POLICY IF EXISTS "Permitir todas operações" ON vouchers;
DROP POLICY IF EXISTS "Permitir todas operações" ON enquetes;
DROP POLICY IF EXISTS "Permitir todas operações" ON questoes_enquetes;
DROP POLICY IF EXISTS "Permitir todas operações" ON respostas_enquetes;
DROP POLICY IF EXISTS "Permitir todas operações" ON gamificacao;
DROP POLICY IF EXISTS "Permitir todas operações" ON pontos_usuarios;
DROP POLICY IF EXISTS "Permitir todas operações" ON logs_atividades;
DROP POLICY IF EXISTS "Permitir todas operações" ON hotspots;
DROP POLICY IF EXISTS "Permitir todas operações" ON metricas_uso;
DROP POLICY IF EXISTS "Permitir todas operações" ON usuarios;
DROP POLICY IF EXISTS "Permitir todas operações" ON sessoes_usuarios;
DROP POLICY IF EXISTS "Permitir todas operações" ON logs_acesso;

-- Criar uma revenda padrão se não existir nenhuma
INSERT INTO revendas (
  id,
  nome,
  dominio,
  logo_url,
  cor_primaria,
  cor_secundaria,
  status,
  limite_hotspots,
  limite_clientes,
  limite_usuarios_simultaneos,
  plano_id
)
SELECT
  gen_random_uuid(),
  'Revenda Padrão',
  'localhost',
  '/logo.png',
  '#3b82f6',
  '#8b5cf6',
  'ativo',
  100,
  100,
  1000,
  (SELECT id FROM planos LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM revendas LIMIT 1);

-- Criar um plano padrão se não existir nenhum
INSERT INTO planos (
  id,
  nome,
  descricao,
  preco_mensal,
  limite_hotspots,
  limite_clientes,
  limite_usuarios_simultaneos,
  recursos,
  ativo
)
SELECT
  gen_random_uuid(),
  'Plano Básico',
  'Plano básico com recursos essenciais',
  99.90,
  10,
  50,
  100,
  '{"campanhas": true, "vouchers": true, "enquetes": true, "gamificacao": true}'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM planos LIMIT 1);

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'RLS desabilitado com sucesso em todas as tabelas';
  RAISE NOTICE 'Sistema configurado para acesso público sem autenticação';
END $$;
