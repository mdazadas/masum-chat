-- Fix RLS policies for chats and participants
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view chats they are part of" ON chats;
DROP POLICY IF EXISTS "Users can view participants of their chats" ON chat_participants;
DROP POLICY IF EXISTS "Users can create chats" ON chats;
DROP POLICY IF EXISTS "Users can add participants" ON chat_participants;

-- Chats: Users can view chats they are part of
CREATE POLICY "Users can view chats they are part of" ON chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_id = chats.id AND user_id = auth.uid()
    )
  );

-- Chats: Users can create chats
CREATE POLICY "Users can create chats" ON chats
  FOR INSERT WITH CHECK (true);

-- Chat Participants: Users can view participants
CREATE POLICY "Users can view participants of their chats" ON chat_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_participants cp
      WHERE cp.chat_id = chat_participants.chat_id AND cp.user_id = auth.uid()
    )
  );

-- Chat Participants: Users can add participants when creating chat
CREATE POLICY "Users can add participants" ON chat_participants
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_id = chat_participants.chat_id AND user_id = auth.uid()
    )
  );

-- Messages: Make sure policies are correct
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their chats" ON messages;

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
