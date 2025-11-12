-- Limpa usuários existentes
DELETE FROM usuarios;
DELETE FROM sessoes_usuarios;
DELETE FROM logs_acesso;

-- Insere usuários com os hashes EXATOS que o código está gerando
-- Senha para todos: "123456"
-- Hash SHA-256 de "123456" = 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92

INSERT INTO usuarios (
  id,
  username,
  senha_hash,
  nome_completo,
  email,
  role,
  ativo,
  revenda_id,
  cliente_id,
  permissoes,
  criado_em,
  atualizado_em
) VALUES
-- Admin Geral
(
  gen_random_uuid(),
  'admin',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
  'Administrador Geral',
  'admin@sistema.com',
  'admin_geral',
  true,
  NULL,
  NULL,
  '{"gerenciar_revendas": true, "gerenciar_planos": true, "visualizar_metricas_globais": true}'::jsonb,
  NOW(),
  NOW()
),
-- Admin Revenda
(
  gen_random_uuid(),
  'revenda',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
  'Administrador Revenda',
  'revenda@empresa.com',
  'admin_revenda',
  true,
  (SELECT id FROM revendas LIMIT 1),
  NULL,
  '{"gerenciar_clientes": true, "gerenciar_hotspots": true, "gerenciar_campanhas": true, "configurar_white_label": true}'::jsonb,
  NOW(),
  NOW()
),
-- Cliente
(
  gen_random_uuid(),
  'cliente',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
  'Cliente Teste',
  'cliente@empresa.com',
  'cliente',
  true,
  (SELECT id FROM revendas LIMIT 1),
  NULL,
  '{"gerenciar_usuarios": true, "visualizar_hotspots": true, "visualizar_relatorios": true}'::jsonb,
  NOW(),
  NOW()
);

-- Verifica se os usuários foram inseridos
SELECT 
  username,
  nome_completo,
  role,
  ativo,
  'Senha: 123456' as senha
FROM usuarios
ORDER BY 
  CASE role
    WHEN 'admin_geral' THEN 1
    WHEN 'admin_revenda' THEN 2
    WHEN 'cliente' THEN 3
    ELSE 4
  END;
