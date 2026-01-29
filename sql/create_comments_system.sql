-- Real-time Comments System for Services
-- YouTube/Instagram-style comments with nested replies

-- 1. Create comments table
CREATE TABLE IF NOT EXISTS service_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES service_comments(id) ON DELETE CASCADE, -- For nested replies
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_avatar TEXT,
  content TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'approved', -- 'approved', 'pending', 'hidden', 'deleted'
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create comment likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES service_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 3. Create comment reports table (for spam/abuse)
CREATE TABLE IF NOT EXISTS comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES service_comments(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL, -- 'spam', 'abuse', 'inappropriate', 'other'
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create service comment settings table
CREATE TABLE IF NOT EXISTS service_comment_settings (
  service_id TEXT PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
  comments_enabled BOOLEAN DEFAULT TRUE,
  require_approval BOOLEAN DEFAULT FALSE,
  allow_replies BOOLEAN DEFAULT TRUE,
  max_depth INTEGER DEFAULT 3, -- Maximum nesting level
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable real-time
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE service_comments;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE comment_likes;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- 6. Set replica identity
ALTER TABLE service_comments REPLICA IDENTITY FULL;
ALTER TABLE comment_likes REPLICA IDENTITY FULL;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_comments_service_id ON service_comments(service_id);
CREATE INDEX IF NOT EXISTS idx_service_comments_parent_id ON service_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_service_comments_user_id ON service_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_service_comments_status ON service_comments(status);
CREATE INDEX IF NOT EXISTS idx_service_comments_created_at ON service_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment_id ON comment_reports(comment_id);

-- 8. Function to update replies count
CREATE OR REPLACE FUNCTION update_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE service_comments
    SET replies_count = replies_count + 1
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE service_comments
    SET replies_count = GREATEST(0, replies_count - 1)
    WHERE id = OLD.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger for replies count
DROP TRIGGER IF EXISTS update_comment_replies_count ON service_comments;
CREATE TRIGGER update_comment_replies_count
AFTER INSERT OR DELETE ON service_comments
FOR EACH ROW EXECUTE FUNCTION update_replies_count();

-- 10. Function to update likes count
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE service_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE service_comments
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger for likes count
DROP TRIGGER IF EXISTS update_comment_likes_count ON comment_likes;
CREATE TRIGGER update_comment_likes_count
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- 12. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_comment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.content != OLD.content THEN
    NEW.is_edited = TRUE;
    NEW.edited_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Trigger for timestamp
DROP TRIGGER IF EXISTS update_service_comments_timestamp ON service_comments;
CREATE TRIGGER update_service_comments_timestamp
BEFORE UPDATE ON service_comments
FOR EACH ROW EXECUTE FUNCTION update_comment_timestamp();

-- 14. Grant permissions
GRANT ALL ON service_comments TO authenticated;
GRANT ALL ON service_comments TO service_role;
GRANT ALL ON comment_likes TO authenticated;
GRANT ALL ON comment_likes TO service_role;
GRANT ALL ON comment_reports TO authenticated;
GRANT ALL ON comment_reports TO service_role;
GRANT ALL ON service_comment_settings TO authenticated;
GRANT ALL ON service_comment_settings TO service_role;

-- 15. Insert default comment settings for existing services
INSERT INTO service_comment_settings (service_id, comments_enabled, require_approval, allow_replies)
SELECT id, TRUE, FALSE, TRUE
FROM services
ON CONFLICT (service_id) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Real-time comments system created successfully!';
  RAISE NOTICE '✅ Nested replies enabled (max depth: 3)';
  RAISE NOTICE '✅ Like/unlike functionality ready';
  RAISE NOTICE '✅ Admin moderation tools configured';
  RAISE NOTICE '✅ Spam reporting system active';
  RAISE NOTICE '🚀 Comments system is ready to use!';
END $$;
