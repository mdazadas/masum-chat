-- FINAL FIX: Complete RLS Policies for Direct Chat
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop ALL existing policies
-- ============================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own requests" ON chat_requests;
DROP POLICY IF EXISTS "Users can send requests" ON chat_requests;
DROP POLICY IF EXISTS "Users can update received requests" ON chat_requests;
DROP POLICY IF EXISTS "Users can view chats they are part of" ON chats;
DROP POLICY IF EXISTS "Users can create chats" ON chats;
DROP POLICY IF EXISTS "Users can view participants of their chats" ON chat_participants;
DROP POLICY IF EXISTS "Users can add participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their chats" ON messages;

-- ============================================
-- STEP 2: Create SIMPLIFIED policies
-- ============================================

-- Profiles: Everyone can view, users can update own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Chats: Authenticated users can create and view their chats
CREATE POLICY "chats_select" ON chats 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_id = chats.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "chats_insert" ON chats 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Chat Participants: Simplified - allow authenticated users
CREATE POLICY "participants_select" ON chat_participants 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "participants_insert" ON chat_participants 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Messages: Users can view and send messages in their chats
CREATE POLICY "messages_select" ON messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert" ON messages 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 3: Verify policies
-- ============================================
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
