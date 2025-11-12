-- Script para garantir que o trigger de criação de perfis funcione corretamente
-- e criar um usuário admin geral

-- 1. Recriar a função de trigger para criar perfis automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfis (
    id,
    email,
    nome,
    role,
    ativo,
    criado_em,
    atualizado_em
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente'),
    true,
    NOW(),
    NOW()
  );
  
  -- Criar registro de pontos para o usuário
  INSERT INTO public.pontos_usuarios (
    id,
    usuario_id,
    pontos_totais,
    nivel,
    conquistas,
    atualizado_em
  )
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
$$;

-- 2. Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Criar perfis para usuários existentes que não têm perfil
INSERT INTO public.perfis (id, email, nome, role, ativo, criado_em, atualizado_em)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  COALESCE(u.raw_user_meta_data->>'role', 'cliente'),
  true,
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.perfis p ON u.id = p.id
WHERE p.id IS NULL;

-- 4. Criar pontos para usuários que não têm
INSERT INTO public.pontos_usuarios (id, usuario_id, pontos_totais, nivel, conquistas, atualizado_em)
SELECT 
  gen_random_uuid(),
  p.id,
  0,
  1,
  '[]'::jsonb,
  NOW()
FROM public.perfis p
LEFT JOIN public.pontos_usuarios pu ON p.id = pu.usuario_id
WHERE pu.id IS NULL;

-- 5. Verificar usuários criados
SELECT 
  p.id,
  p.email,
  p.nome,
  p.role,
  p.ativo,
  CASE 
    WHEN pu.id IS NOT NULL THEN 'Sim'
    ELSE 'Não'
  END as tem_pontos
FROM perfis p
LEFT JOIN pontos_usuarios pu ON p.id = pu.usuario_id
ORDER BY p.criado_em DESC;

-- INSTRUÇÕES:
-- 1. Execute este script primeiro para garantir que o trigger funcione
-- 2. Vá para /auth/register e crie uma conta com tipo "Administrador Geral"
-- 3. Confirme seu email (se necessário)
-- 4. Faça login em /auth/login
-- 5. Você será automaticamente redirecionado para /admin-geral/dashboard
