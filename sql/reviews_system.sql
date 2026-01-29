-- Reviews and Ratings System
-- Complete comments/reviews implementation with photos, admin responses, and moderation

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  recommend BOOLEAN,
 
  photos TEXT[], -- Array of photo URLs
  
  -- Additional info
  service_name TEXT,
  customer_name TEXT,
  customer_avatar TEXT,
  car_model TEXT,
  
  -- Admin response
  admin_response TEXT,
  admin_response_by UUID REFERENCES profiles(id),
  admin_response_at TIMESTAMPTZ,
  
  -- Moderation
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_by UUID REFERENCES profiles(id),
  moderated_at TIMESTAMPTZ,
  
  -- Flags
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT true, -- Verified purchase
  helpful_count INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(booking_id) -- One review per booking
);

-- Review Helpfulness Tracking
CREATE TABLE IF NOT EXISTS review_helpful (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL, -- true for helpful, false for not helpful
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

-- Review Photos
CREATE TABLE IF NOT EXISTS review_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Rating Summary (Materialized View Alternative)
CREATE TABLE IF NOT EXISTS service_ratings (
  service_id UUID PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_is_featured ON reviews(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_review_helpful_review_id ON review_helpful(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);

-- Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Users can view approved reviews"
  ON reviews FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid());

CREATE POLICY "Users can create their own reviews"
  ON reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all reviews"
  ON reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
    )
  );

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

-- RLS Policies for review_photos
CREATE POLICY "Anyone can view photos"
  ON review_photos FOR SELECT
  USING (true);

CREATE POLICY "Review owners can add photos"
  ON review_photos FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_id AND reviews.user_id = auth.uid())
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
  -- Update service ratings summary
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
  WHERE service_id = NEW.service_id AND status = 'approved'
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
CREATE TRIGGER trigger_update_service_ratings
AFTER INSERT OR UPDATE OF rating, status ON reviews
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
CREATE TRIGGER trigger_update_report_count
AFTER INSERT OR UPDATE OR DELETE ON review_reports
FOR EACH ROW
EXECUTE FUNCTION update_review_report_count();

-- Function to get reviews with stats
CREATE OR REPLACE FUNCTION get_service_reviews(service_id_param UUID)
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
  is_featured BOOLEAN,
  helpful_count INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id, r.user_id, r.booking_id, r.rating, r.comment, r.recommend,
    r.photos, r.customer_name, r.customer_avatar, r.car_model,
    r.admin_response, r.admin_response_at, r.is_featured, r.helpful_count,
    r.created_at
  FROM reviews r
  WHERE r.service_id = service_id_param AND r.status = 'approved'
  ORDER BY r.is_featured DESC, r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
