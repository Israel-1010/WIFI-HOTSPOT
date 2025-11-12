-- Criar perfis para usuários existentes que não têm perfil
INSERT INTO public.perfis (id, nome, email, role, revenda_id)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', au.email),
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'cliente')::text,
  NULL
FROM auth.users au
LEFT JOIN public.perfis p ON p.id = au.id
WHERE p.id IS NULL;

-- Criar ou substituir a função que cria perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (id, nome, email, role, revenda_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente')::text,
    (NEW.raw_user_meta_data->>'revenda_id')::uuid
  );
  
  -- Criar registro de pontos para o novo usuário
  INSERT INTO public.pontos_usuarios (usuario_id, pontos_totais, pontos_disponiveis)
  VALUES (NEW.id, 0, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger para criar perfil automaticamente quando um usuário se registra
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Criar pontos para usuários que já têm perfil mas não têm pontos
INSERT INTO public.pontos_usuarios (usuario_id, pontos_totais, pontos_disponiveis)
SELECT p.id, 0, 0
FROM public.perfis p
LEFT JOIN public.pontos_usuarios pu ON pu.usuario_id = p.id
WHERE pu.usuario_id IS NULL;
