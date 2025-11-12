-- Corrigir usuário admin com a senha correta
-- Senha: admin123
-- Hash SHA-256: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9

-- Deletar usuário admin existente se houver
DELETE FROM usuarios WHERE username = 'admin';

-- Inserir usuário admin com senha correta
INSERT INTO usuarios (
  id,
  username,
  senha_hash,
  nome_completo,
  email,
  role,
  ativo,
  permissoes,
  criado_em
) VALUES (
  gen_random_uuid(),
  'admin',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'Administrador Geral',
  'admin@sistema.com',
  'admin_geral',
  true,
  '{"gerenciar_revendas": true, "gerenciar_planos": true, "visualizar_metricas_globais": true}'::jsonb,
  NOW()
);

-- Verificar se os usuários foram inseridos corretamente
SELECT username, nome_completo, role, ativo FROM usuarios ORDER BY role;
