-- Script para configurar o sistema de autenticação customizado
-- Adiciona campos faltantes e cria dados iniciais

-- Adicionar campo cliente_id na tabela usuarios se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'usuarios' AND column_name = 'cliente_id') THEN
    ALTER TABLE usuarios ADD COLUMN cliente_id uuid REFERENCES perfis(id);
  END IF;
END $$;

-- Adicionar campo cnpj na tabela perfis se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'perfis' AND column_name = 'cnpj') THEN
    ALTER TABLE perfis ADD COLUMN cnpj text;
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_revenda_id ON usuarios(revenda_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_cliente_id ON usuarios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_token ON sessoes_usuarios(token);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_id ON sessoes_usuarios(usuario_id);

-- Criar usuário admin geral padrão (senha: admin123)
INSERT INTO usuarios (id, username, email, senha_hash, nome_completo, role, ativo, permissoes, criado_em, atualizado_em)
VALUES (
  gen_random_uuid(),
  'admin',
  'admin@sistema.com',
  'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', -- SHA-256 de 'admin123'
  'Administrador Geral',
  'admin_geral',
  true,
  '{"gerenciar_revendas": true, "gerenciar_planos": true, "visualizar_metricas_globais": true}'::jsonb,
  now(),
  now()
)
ON CONFLICT (username) DO NOTHING;

-- Criar revenda padrão se não existir
INSERT INTO revendas (id, nome, status, criado_em, atualizado_em)
SELECT 
  gen_random_uuid(),
  'Revenda Padrão',
  'ativo',
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM revendas LIMIT 1);

-- Criar usuário admin de revenda padrão (senha: revenda123)
DO $$
DECLARE
  v_revenda_id uuid;
BEGIN
  SELECT id INTO v_revenda_id FROM revendas LIMIT 1;
  
  IF v_revenda_id IS NOT NULL THEN
    INSERT INTO usuarios (id, username, email, senha_hash, nome_completo, role, revenda_id, ativo, permissoes, criado_em, atualizado_em)
    VALUES (
      gen_random_uuid(),
      'revenda',
      'revenda@exemplo.com',
      '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', -- SHA-256 de 'revenda123'
      'Administrador Revenda',
      'admin_revenda',
      v_revenda_id,
      true,
      '{"gerenciar_clientes": true, "gerenciar_hotspots": true, "gerenciar_campanhas": true, "configurar_white_label": true}'::jsonb,
      now(),
      now()
    )
    ON CONFLICT (username) DO NOTHING;
  END IF;
END $$;

COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema com autenticação customizada';
COMMENT ON COLUMN usuarios.role IS 'Roles: admin_geral, admin_revenda, cliente, usuario';
COMMENT ON COLUMN usuarios.cliente_id IS 'Referência ao cliente (empresa) para usuários do tipo usuario';
