-- Inserir usuários de teste
-- Senhas: admin123, revenda123, cliente123

-- Limpar usuários existentes (opcional)
DELETE FROM sessoes_usuarios;
DELETE FROM logs_acesso;
DELETE FROM usuarios;

-- Inserir Admin Geral
INSERT INTO usuarios (
  id,
  username,
  senha_hash,
  email,
  nome_completo,
  role,
  ativo,
  permissoes,
  criado_em,
  atualizado_em
) VALUES (
  gen_random_uuid(),
  'admin',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', -- admin123
  'admin@hotspot360.com',
  'Administrador Geral',
  'admin_geral',
  true,
  '{"gerenciar_revendas": true, "gerenciar_planos": true, "visualizar_metricas": true}'::jsonb,
  now(),
  now()
);

-- Inserir Admin Revenda
INSERT INTO usuarios (
  id,
  username,
  senha_hash,
  email,
  nome_completo,
  role,
  ativo,
  permissoes,
  criado_em,
  atualizado_em
) VALUES (
  gen_random_uuid(),
  'revenda',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', -- revenda123
  'revenda@hotspot360.com',
  'Administrador Revenda',
  'admin_revenda',
  true,
  '{"gerenciar_clientes": true, "gerenciar_hotspots": true, "gerenciar_campanhas": true}'::jsonb,
  now(),
  now()
);

-- Inserir Cliente de teste
INSERT INTO usuarios (
  id,
  username,
  senha_hash,
  email,
  nome_completo,
  role,
  ativo,
  permissoes,
  criado_em,
  atualizado_em
) VALUES (
  gen_random_uuid(),
  'cliente',
  '6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090', -- cliente123
  'cliente@hotspot360.com',
  'Cliente Teste',
  'cliente',
  true,
  '{"gerenciar_usuarios": true, "visualizar_relatorios": true}'::jsonb,
  now(),
  now()
);

-- Verificar usuários criados
SELECT 
  username,
  email,
  nome_completo,
  role,
  ativo,
  criado_em
FROM usuarios
ORDER BY role;
