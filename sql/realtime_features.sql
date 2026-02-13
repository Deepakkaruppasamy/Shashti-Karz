-- Enable Realtime for existing tables (if not already enabled)
-- We use a DO block to avoid errors if they are already added

DO $$
BEGIN
  -- 1. Rescheduling
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE reschedule_requests;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;

  -- 2. Reviews
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;

  -- 3. Gamification Tables
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE achievements;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE points_transactions;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;

  -- Leaderboard is likely a view or complex query, but if it is a table:
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE customer_leaderboard;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;

  -- 4. Support & Feedback
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE support_requests;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE customer_feedback_dinesh;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;
  
  -- 5. Bookings (Core for Pulse)
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;
  
  -- 6. Profiles (For user updates)
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;

END $$;

-- Create Support Messages Table for Real-time Chat
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES support_requests(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'admin', 'system')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Policies for Messages
DROP POLICY IF EXISTS "Public read access for support_messages" ON support_messages;
CREATE POLICY "Public read access for support_messages" ON support_messages FOR SELECT USING (true); -- Optimize later

DROP POLICY IF EXISTS "Users can insert support_messages" ON support_messages;
CREATE POLICY "Users can insert support_messages" ON support_messages FOR INSERT WITH CHECK (true); -- Optimize later

-- Enable Realtime for Messages
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END $$;
