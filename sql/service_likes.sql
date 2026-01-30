-- Service Likes System
-- Allows users to like individual services

CREATE TABLE IF NOT EXISTS service_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_id, user_id)
);

-- Enable RLS
ALTER TABLE service_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view likes" ON service_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON service_likes
  FOR ALL USING (auth.uid() = user_id);

-- Enable Real-time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'service_likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE service_likes;
  END IF;
END $$;
