-- Complete fix for login issue
-- Run this in Supabase SQL Editor

-- Step 1: Manually confirm the email and set all required fields
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW(),
  last_sign_in_at = NOW()
WHERE email = 'masum79900@gmail.com';

-- Step 2: Make sure profile exists
INSERT INTO public.profiles (id, username, display_name)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'username', 'masum'),
  COALESCE(raw_user_meta_data->>'display_name', 'Masum')
FROM auth.users
WHERE email = 'masum79900@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
  username = COALESCE(EXCLUDED.username, profiles.username),
  display_name = COALESCE(EXCLUDED.display_name, profiles.display_name);

-- Step 3: Check if user exists and is confirmed
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
WHERE email = 'masum79900@gmail.com';

-- Step 4: Check if profile exists
SELECT * FROM public.profiles
WHERE id IN (SELECT id FROM auth.users WHERE email = 'masum79900@gmail.com');
