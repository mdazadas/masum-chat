-- Video Call System Database Schema
-- Run this in Supabase SQL Editor

-- Create calls table
CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    caller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'calling' CHECK (status IN ('calling', 'ringing', 'connected', 'ended', 'rejected', 'missed', 'busy')),
    call_type TEXT DEFAULT 'video' CHECK (call_type IN ('video', 'audio')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    connected_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration INTEGER, -- in seconds
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create call_signals table for WebRTC signaling
CREATE TABLE IF NOT EXISTS call_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    signal_type TEXT CHECK (signal_type IN ('offer', 'answer', 'ice-candidate')),
    signal_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calls_chat_id ON calls(chat_id);
CREATE INDEX IF NOT EXISTS idx_calls_caller_id ON calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_receiver_id ON calls(receiver_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_call_signals_call_id ON call_signals(call_id);

-- Disable RLS for testing (enable in production with proper policies)
ALTER TABLE calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE call_signals DISABLE ROW LEVEL SECURITY;

-- Enable realtime for calls and signals
ALTER PUBLICATION supabase_realtime ADD TABLE calls;
ALTER PUBLICATION supabase_realtime ADD TABLE call_signals;

-- Function to automatically update call duration when ended
CREATE OR REPLACE FUNCTION update_call_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'ended' AND OLD.status = 'connected' THEN
        NEW.duration = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.connected_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update duration
DROP TRIGGER IF EXISTS trigger_update_call_duration ON calls;
CREATE TRIGGER trigger_update_call_duration
    BEFORE UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION update_call_duration();

-- Verify tables created
SELECT 
    tablename, 
    schemaname 
FROM pg_tables 
WHERE tablename IN ('calls', 'call_signals')
ORDER BY tablename;
