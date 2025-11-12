-- Remove a constraint antiga de role e adiciona uma nova que inclui admin_geral

-- Remove a constraint existente se houver
ALTER TABLE public.perfis 
DROP CONSTRAINT IF EXISTS perfis_role_check;

-- Adiciona nova constraint que permite os três tipos de role
ALTER TABLE public.perfis 
ADD CONSTRAINT perfis_role_check 
CHECK (role IN ('cliente', 'admin_revenda', 'admin_geral'));

-- Atualiza a função de criação de perfil para suportar admin_geral
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
  user_name text;
  user_email text;
BEGIN
  -- Extrai o role dos metadados do usuário (padrão: cliente)
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'cliente');
  
  -- Garante que o role é válido
  IF user_role NOT IN ('cliente', 'admin_revenda', 'admin_geral') THEN
    user_role := 'cliente';
  END IF;
  
  -- Extrai nome e email
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  user_email := NEW.email;

  -- Cria o perfil
  INSERT INTO public.perfis (id, email, nome, role, ativo, criado_em, atualizado_em)
  VALUES (
    NEW.id,
    user_email,
    user_name,
    user_role,
    true,
    NOW(),
    NOW()
  );

  -- Cria registro de pontos para o usuário
  INSERT INTO public.pontos_usuarios (id, usuario_id, pontos_totais, nivel, conquistas, atualizado_em)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    0,
    1,
    '[]'::jsonb,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recria o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Cria perfis para usuários existentes que não têm perfil
INSERT INTO public.perfis (id, email, nome, role, ativo, criado_em, atualizado_em)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'role', 'cliente')::text,
  true,
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.perfis p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Cria pontos para usuários que não têm
INSERT INTO public.pontos_usuarios (id, usuario_id, pontos_totais, nivel, conquistas, atualizado_em)
SELECT 
  gen_random_uuid(),
  p.id,
  0,
  1,
  '[]'::jsonb,
  NOW()
FROM public.perfis p
LEFT JOIN public.pontos_usuarios pu ON pu.usuario_id = p.id
WHERE pu.id IS NULL
ON CONFLICT DO NOTHING;
