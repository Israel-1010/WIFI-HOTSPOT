-- Create a test admin user for development
-- This script creates a user that bypasses email confirmation
-- IMPORTANT: Only use this in development! Remove in production.

-- First, we need to insert directly into auth.users
-- Note: In production, users should always go through the normal signup flow

DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Generate a UUID for the test user
  test_user_id := gen_random_uuid();
  
  -- Insert into auth.users (bypassing normal signup)
  -- Password is 'admin123' (hashed)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    aud,
    role
  ) VALUES (
    test_user_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@test.com',
    -- This is the hash for 'admin123' using bcrypt
    -- In a real scenario, Supabase handles this
    crypt('admin123', gen_salt('bf')),
    NOW(), -- Email confirmed immediately
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin Test","role":"admin"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    'authenticated',
    'authenticated'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- The trigger will automatically create the profile
  -- But let's make sure it exists with admin role
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    test_user_id,
    'admin@test.com',
    'Admin Test',
    'admin'
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
  
  -- Create user points record
  INSERT INTO public.user_points (user_id, points, level)
  VALUES (test_user_id, 0, 1)
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Test admin user created successfully!';
  RAISE NOTICE 'Email: admin@test.com';
  RAISE NOTICE 'Password: admin123';
END $$;
