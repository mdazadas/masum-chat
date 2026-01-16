-- Manually confirm the email for masum79900@gmail.com
-- Run this in Supabase SQL Editor

UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'masum79900@gmail.com';
