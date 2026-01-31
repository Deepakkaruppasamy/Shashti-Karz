-- Dinesh Voice Assistant System
-- Support requests and feedback management

-- Support Requests Table
CREATE TABLE IF NOT EXISTS support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  category TEXT NOT NULL CHECK (category IN ('navigation', 'service_info', 'booking_help', 'technical', 'general', 'other')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  admin_response TEXT,
  admin_responder_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  conversation_history JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Feedback Table (separate from reviews)
CREATE TABLE IF NOT EXISTS customer_feedback_dinesh (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('feature_request', 'bug_report', 'compliment', 'complaint', 'suggestion', 'other')),
  category TEXT CHECK (category IN ('website', 'booking', 'service', 'payment', 'communication', 'voice_assistant', 'other')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10),
  would_recommend BOOLEAN DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'acknowledged', 'implemented', 'closed')),
  admin_notes TEXT,
  admin_reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice Assistant Interactions Log
CREATE TABLE IF NOT EXISTS dinesh_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('navigation', 'service_query', 'booking', 'support', 'feedback', 'general')),
  user_query TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  intent_detected TEXT,
  confidence_score DECIMAL(3,2),
  was_helpful BOOLEAN,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Request Attachments (for future use)
CREATE TABLE IF NOT EXISTS support_request_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_request_id UUID REFERENCES support_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_requests_user_id ON support_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_created_at ON support_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_requests_priority ON support_requests(priority);

CREATE INDEX IF NOT EXISTS idx_customer_feedback_dinesh_user_id ON customer_feedback_dinesh(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_dinesh_status ON customer_feedback_dinesh(status);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_dinesh_type ON customer_feedback_dinesh(feedback_type);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_dinesh_created_at ON customer_feedback_dinesh(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dinesh_interactions_session_id ON dinesh_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_dinesh_interactions_user_id ON dinesh_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_dinesh_interactions_type ON dinesh_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_dinesh_interactions_created_at ON dinesh_interactions(created_at DESC);

-- Timestamp trigger for support_requests
CREATE OR REPLACE FUNCTION update_support_requests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;
  IF NEW.admin_response IS NOT NULL AND NEW.admin_response != COALESCE(OLD.admin_response, '') THEN
    NEW.responded_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_support_requests_timestamp
  BEFORE UPDATE ON support_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_support_requests_timestamp();

-- Enable RLS (Row Level Security)
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_feedback_dinesh ENABLE ROW LEVEL SECURITY;
ALTER TABLE dinesh_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_request_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_requests
CREATE POLICY "Users can view their own support requests"
  ON support_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create support requests"
  ON support_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own support requests"
  ON support_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all support requests"
  ON support_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all support requests"
  ON support_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for customer_feedback_dinesh
CREATE POLICY "Users can view their own feedback"
  ON customer_feedback_dinesh FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create feedback"
  ON customer_feedback_dinesh FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all feedback"
  ON customer_feedback_dinesh FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update feedback"
  ON customer_feedback_dinesh FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for dinesh_interactions
CREATE POLICY "Users can view their own interactions"
  ON dinesh_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can log interactions"
  ON dinesh_interactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all interactions"
  ON dinesh_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for support_request_attachments
CREATE POLICY "Users can view attachments for their requests"
  ON support_request_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_requests
      WHERE support_requests.id = support_request_attachments.support_request_id
      AND support_requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload attachments to their requests"
  ON support_request_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_requests
      WHERE support_requests.id = support_request_attachments.support_request_id
      AND support_requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all attachments"
  ON support_request_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to get support request analytics
CREATE OR REPLACE FUNCTION get_support_analytics(start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days')
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_requests', COUNT(*),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'resolved', COUNT(*) FILTER (WHERE status = 'resolved'),
    'closed', COUNT(*) FILTER (WHERE status = 'closed'),
    'avg_response_time_hours', EXTRACT(EPOCH FROM AVG(responded_at - created_at))/3600,
    'avg_resolution_time_hours', EXTRACT(EPOCH FROM AVG(resolved_at - created_at))/3600,
    'by_category', (
      SELECT json_object_agg(category, count)
      FROM (
        SELECT category, COUNT(*) as count
        FROM support_requests
        WHERE created_at >= start_date
        GROUP BY category
      ) cats
    ),
    'by_priority', (
      SELECT json_object_agg(priority, count)
      FROM (
        SELECT priority, COUNT(*) as count
        FROM support_requests
        WHERE created_at >= start_date
        GROUP BY priority
      ) priorities
    )
  ) INTO result
  FROM support_requests
  WHERE created_at >= start_date;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE support_requests IS 'Customer support requests raised through Dinesh voice assistant or other channels';
COMMENT ON TABLE customer_feedback_dinesh IS 'Customer feedback separate from service reviews, managed through Dinesh';
COMMENT ON TABLE dinesh_interactions IS 'Log of all voice assistant interactions for analytics and improvement';
COMMENT ON TABLE support_request_attachments IS 'File attachments for support requests';
