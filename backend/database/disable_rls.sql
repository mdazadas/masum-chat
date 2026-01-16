-- ULTIMATE FIX: Disable RLS temporarily for testing
-- Run this in Supabase SQL Editor

-- Disable RLS on all tables for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
