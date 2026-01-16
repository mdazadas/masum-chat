-- COMPLETE FIX: All RLS Policies for Masum Chat
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop all existing policies
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
-- STEP 2: Profiles Policies
-- ============================================
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- STEP 3: Chat Requests Policies
-- ============================================
CREATE POLICY "Users can view their own requests" ON chat_requests
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send requests" ON chat_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received requests" ON chat_requests
  FOR UPDATE USING (auth.uid() = receiver_id);

-- ============================================
-- STEP 4: Chats Policies (SIMPLIFIED)
-- ============================================
CREATE POLICY "Users can view chats they are part of" ON chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_id = chats.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chats" ON chats
  FOR INSERT WITH CHECK (true);

-- ============================================
-- STEP 5: Chat Participants Policies (SIMPLIFIED)
-- ============================================
CREATE POLICY "Users can view participants of their chats" ON chat_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can add participants" ON chat_participants
  FOR INSERT WITH CHECK (true);

-- ============================================
-- STEP 6: Messages Policies
-- ============================================
CREATE POLICY "Users can view messages in their chats" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their chats" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 7: Verify all policies are created
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
