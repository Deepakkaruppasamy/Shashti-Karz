-- Reviews System - Minimal Addition to Existing Schema
-- This adds only the missing tables and columns to the existing reviews table

-- Add missing columns to existing reviews table (if they don't exist)
DO $$ 
BEGIN
  -- Add photos column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'photos') THEN
    ALTER TABLE reviews ADD COLUMN photos TEXT[] DEFAULT '{}';
  END IF;

  -- Add recommend column if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'recommend') THEN
    ALTER TABLE reviews ADD COLUMN recommend BOOLEAN;
  END IF;

  -- Add admin response columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'admin_response') THEN
    ALTER TABLE reviews ADD COLUMN admin_response TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_response_by') THEN
    ALTER TABLE reviews ADD COLUMN admin_response_by UUID REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'admin_response_at') THEN
    ALTER TABLE reviews ADD COLUMN admin_response_at TIMESTAMPTZ;
  END IF;

  -- Add helpful_count if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'helpful_count') THEN
    ALTER TABLE reviews ADD COLUMN helpful_count INTEGER DEFAULT 0;
  END IF;

  -- Add report_count if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'report_count') THEN
    ALTER TABLE reviews ADD COLUMN report_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Review Helpfulness Tracking
CREATE TABLE IF NOT EXISTS review_helpful (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Review Reports
CREATE TABLE IF NOT EXISTS review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fake', 'offensive', 'other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Rating Summary
CREATE TABLE IF NOT EXISTS service_ratings (
  service_id TEXT PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL DEFAULT 0,
  rating_5_count INTEGER DEFAULT 0,
  rating_4_count INTEGER DEFAULT 0,
  rating_3_count INTEGER DEFAULT 0,
  rating_2_count INTEGER DEFAULT 0,
  rating_1_count INTEGER DEFAULT 0,
  total_photos INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_helpful_review_id ON review_helpful(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);

-- Row Level Security
ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_helpful
CREATE POLICY "Anyone can view helpful counts"
  ON review_helpful FOR SELECT
  USING (true);

CREATE POLICY "Users can mark reviews as helpful"
  ON review_helpful FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their helpful marks"
  ON review_helpful FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for review_reports
CREATE POLICY "Users can view their own reports"
  ON review_reports FOR SELECT
  USING (reported_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

CREATE POLICY "Users can create reports"
  ON review_reports FOR INSERT
  WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Admins can manage reports"
  ON review_reports FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- RLS Policies for service_ratings
CREATE POLICY "Anyone can view service ratings"
  ON service_ratings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage ratings"
  ON service_ratings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Function to update service ratings
CREATE OR REPLACE FUNCTION update_service_ratings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO service_ratings (service_id, total_reviews, average_rating, 
    rating_5_count, rating_4_count, rating_3_count, rating_2_count, rating_1_count, total_photos)
  SELECT 
    NEW.service_id,
    COUNT(*),
    ROUND(AVG(rating), 2),
    COUNT(*) FILTER (WHERE rating = 5),
    COUNT(*) FILTER (WHERE rating = 4),
    COUNT(*) FILTER (WHERE rating = 3),
    COUNT(*) FILTER (WHERE rating = 2),
    COUNT(*) FILTER (WHERE rating = 1),
    SUM(COALESCE(array_length(photos, 1), 0))
  FROM reviews
  WHERE service_id = NEW.service_id AND approved = true
  ON CONFLICT (service_id) DO UPDATE SET
    total_reviews = EXCLUDED.total_reviews,
    average_rating = EXCLUDED.average_rating,
    rating_5_count = EXCLUDED.rating_5_count,
    rating_4_count = EXCLUDED.rating_4_count,
    rating_3_count = EXCLUDED.rating_3_count,
    rating_2_count = EXCLUDED.rating_2_count,
    rating_1_count = EXCLUDED.rating_1_count,
    total_photos = EXCLUDED.total_photos,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update service ratings
DROP TRIGGER IF EXISTS trigger_update_service_ratings ON reviews;
CREATE TRIGGER trigger_update_service_ratings
AFTER INSERT OR UPDATE OF rating, approved ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_service_ratings();

-- Function to update helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE reviews
  SET helpful_count = (
    SELECT COUNT(*) FROM review_helpful 
    WHERE review_id = COALESCE(NEW.review_id, OLD.review_id) AND is_helpful = true
  )
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for helpful count
DROP TRIGGER IF EXISTS trigger_update_helpful_count ON review_helpful;
CREATE TRIGGER trigger_update_helpful_count
AFTER INSERT OR UPDATE OR DELETE ON review_helpful
FOR EACH ROW
EXECUTE FUNCTION update_review_helpful_count();

-- Function to update report count
CREATE OR REPLACE FUNCTION update_review_report_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE reviews
  SET report_count = (
    SELECT COUNT(*) FROM review_reports 
    WHERE review_id = COALESCE(NEW.review_id, OLD.review_id) AND status = 'pending'
  )
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for report count
DROP TRIGGER IF EXISTS trigger_update_report_count ON review_reports;
CREATE TRIGGER trigger_update_report_count
AFTER INSERT OR UPDATE OR DELETE ON review_reports
FOR EACH ROW
EXECUTE FUNCTION update_review_report_count();

-- Function to get reviews with stats
CREATE OR REPLACE FUNCTION get_service_reviews(service_id_param TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  booking_id UUID,
  rating INTEGER,
  comment TEXT,
  recommend BOOLEAN,
  photos TEXT[],
  customer_name TEXT,
  customer_avatar TEXT,
  car_model TEXT,
  admin_response TEXT,
  admin_response_at TIMESTAMPTZ,
  helpful_count INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id, r.user_id, r.booking_id, r.rating, r.comment, r.recommend,
    r.photos, 
    COALESCE(r.name, p.full_name) as customer_name,
    COALESCE(r.avatar, p.avatar_url) as customer_avatar,
    COALESCE(r.car, '') as car_model,
    r.admin_response, r.admin_response_at, r.helpful_count,
    r.created_at
  FROM reviews r
  LEFT JOIN profiles p ON p.id = r.user_id
  WHERE r.service_id = service_id_param AND r.approved = true
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;
