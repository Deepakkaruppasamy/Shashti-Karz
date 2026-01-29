-- Worker Performance Dashboard
-- Metrics tracking, ratings, revenue, and performance analytics

-- Worker Performance Metrics
CREATE TABLE IF NOT EXISTS worker_performance (
  worker_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_services INTEGER DEFAULT 0,
  completed_services INTEGER DEFAULT 0,
  cancelled_services INTEGER DEFAULT 0,
  average_rating DECIMAL DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_revenue DECIMAL DEFAULT 0,
  on_time_percentage DECIMAL DEFAULT 100,
  quality_score DECIMAL DEFAULT 0,
  efficiency_score DECIMAL DEFAULT 0,
  customer_satisfaction_score DECIMAL DEFAULT 0,
  current_month_services INTEGER DEFAULT 0,
  current_month_revenue DECIMAL DEFAULT 0,
  last_service_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance History (Monthly snapshots)
CREATE TABLE IF NOT EXISTS worker_performance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  services_completed INTEGER DEFAULT 0,
  revenue_generated DECIMAL DEFAULT 0,
  average_rating DECIMAL DEFAULT 0,
  on_time_percentage DECIMAL DEFAULT 0,
  customer_complaints INTEGER DEFAULT 0,
  bonus_earned DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, month)
);

-- Worker Bonuses
CREATE TABLE IF NOT EXISTS worker_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES profiles(id),
  bonus_type TEXT NOT NULL CHECK (bonus_type IN ('performance', 'milestone', 'quality', 'referral', 'special')),
  amount DECIMAL NOT NULL,
  reason TEXT,
  month DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker Training Needs
CREATE TABLE IF NOT EXISTS worker_training_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES profiles(id),
  training_area TEXT NOT NULL CHECK (training_area IN ('customer_service', 'technical_skills', 'time_management', 'quality_control', 'safety')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  identified_reason TEXT,
  status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'scheduled', 'in_progress', 'completed')),
  scheduled_date DATE,
  completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker Attendance
CREATE TABLE IF NOT EXISTS worker_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES profiles(id),
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half_day', 'leave')),
  leave_type TEXT CHECK (leave_type IN ('sick', 'casual', 'emergency', 'planned')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, date)
);

-- Function to update worker performance
CREATE OR REPLACE FUNCTION update_worker_performance(worker_id_param UUID)
RETURNS void AS $$
DECLARE
  perf_stats RECORD;
BEGIN
  -- Calculate performance metrics
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
    COALESCE(AVG(rating), 0) as avg_rating,
    COUNT(rating) as review_count,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN price ELSE 0 END), 0) as revenue,
    COALESCE(AVG(CASE 
      WHEN status = 'completed' AND actual_start_time <= (date::timestamp + time::time + INTERVAL '15 minutes')
      THEN 100 ELSE 0 
    END), 0) as on_time_pct
  INTO perf_stats
  FROM bookings b
  LEFT JOIN reviews r ON b.id = r.booking_id
  WHERE b.worker_id = worker_id_param;
  
  -- Update or insert performance record
  INSERT INTO worker_performance (
    worker_id, total_services, completed_services, cancelled_services,
    average_rating, total_reviews, total_revenue, on_time_percentage
  ) VALUES (
    worker_id_param, perf_stats.total, perf_stats.completed, perf_stats.cancelled,
    perf_stats.avg_rating, perf_stats.review_count, perf_stats.revenue, perf_stats.on_time_pct
  )
  ON CONFLICT (worker_id) DO UPDATE SET
    total_services = perf_stats.total,
    completed_services = perf_stats.completed,
    cancelled_services = perf_stats.cancelled,
    average_rating = perf_stats.avg_rating,
    total_reviews = perf_stats.review_count,
    total_revenue = perf_stats.revenue,
    on_time_percentage = perf_stats.on_time_pct,
    updated_at = NOW();
  
  -- Calculate scores
  UPDATE worker_performance SET
    quality_score = (average_rating / 5.0) * 100,
    efficiency_score = LEAST(100, (completed_services::DECIMAL / NULLIF(total_services, 0) * 100)),
    customer_satisfaction_score = (
      (average_rating / 5.0 * 0.5) + 
      (on_time_percentage / 100 * 0.3) +
      ((100 - (cancelled_services::DECIMAL / NULLIF(total_services, 0) * 100)) / 100 * 0.2)
    ) * 100
  WHERE worker_id = worker_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate monthly bonus
CREATE OR REPLACE FUNCTION calculate_worker_bonus(
  worker_id_param UUID,
  month_param DATE
)
RETURNS DECIMAL AS $$
DECLARE
  perf RECORD;
  bonus_amount DECIMAL := 0;
BEGIN
  -- Get performance for the month
  SELECT * INTO perf
  FROM worker_performance_history
  WHERE worker_id = worker_id_param AND month = month_param;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Base bonus on services completed
  bonus_amount := perf.services_completed * 50; -- ₹50 per service
  
  -- Rating bonus
  IF perf.average_rating >= 4.5 THEN
    bonus_amount := bonus_amount + 2000;
  ELSIF perf.average_rating >= 4.0 THEN
    bonus_amount := bonus_amount + 1000;
  END IF;
  
  -- On-time bonus
  IF perf.on_time_percentage >= 95 THEN
    bonus_amount := bonus_amount + 1500;
  ELSIF perf.on_time_percentage >= 90 THEN
    bonus_amount := bonus_amount + 750;
  END IF;
  
  -- Revenue milestone bonuses
  IF perf.revenue_generated >= 100000 THEN
    bonus_amount := bonus_amount + 5000;
  ELSIF perf.revenue_generated >= 50000 THEN
    bonus_amount := bonus_amount + 2500;
  END IF;
  
  -- Zero complaints bonus
  IF perf.customer_complaints = 0 THEN
    bonus_amount := bonus_amount + 1000;
  END IF;
  
  -- Create bonus record
  INSERT INTO worker_bonuses (worker_id, bonus_type, amount, reason, month)
  VALUES (
    worker_id_param, 'performance', bonus_amount,
    format('Monthly performance bonus for %s', to_char(month_param, 'Month YYYY')),
    month_param
  );
  
  RETURN bonus_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to identify training needs
CREATE OR REPLACE FUNCTION identify_training_needs(worker_id_param UUID)
RETURNS void AS $$
DECLARE
  perf worker_performance%ROWTYPE;
BEGIN
  SELECT * INTO perf FROM worker_performance WHERE worker_id = worker_id_param;
  
  -- Low rating = customer service training
  IF perf.average_rating < 4.0 THEN
    INSERT INTO worker_training_needs (worker_id, training_area, priority, identified_reason)
    VALUES (worker_id_param, 'customer_service', 'high', 
      format('Average rating below 4.0 (current: %.2f)', perf.average_rating))
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Low on-time percentage = time management training
  IF perf.on_time_percentage < 85 THEN
    INSERT INTO worker_training_needs (worker_id, training_area, priority, identified_reason)
    VALUES (worker_id_param, 'time_management', 'medium',
      format('On-time percentage below 85%% (current: %.1f%%)', perf.on_time_percentage))
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Low quality score = technical skills training
  IF perf.quality_score < 75 THEN
    INSERT INTO worker_training_needs (worker_id, training_area, priority, identified_reason)
    VALUES (worker_id_param, 'technical_skills', 'high',
      format('Quality score below 75 (current: %.1f)', perf.quality_score))
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update performance after booking completion
CREATE OR REPLACE FUNCTION trigger_performance_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM update_worker_performance(NEW.worker_id);
    PERFORM identify_training_needs(NEW.worker_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_performance_on_booking
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_performance_update();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_worker_performance_history_worker ON worker_performance_history(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_bonuses_worker ON worker_bonuses(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_training_needs_worker ON worker_training_needs(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_attendance_worker_date ON worker_attendance(worker_id, date);

-- Enable RLS
ALTER TABLE worker_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_training_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Workers can view their own performance" ON worker_performance
  FOR SELECT USING (worker_id = auth.uid());

CREATE POLICY "Workers can view their own history" ON worker_performance_history
  FOR SELECT USING (worker_id = auth.uid());

CREATE POLICY "Workers can view their own bonuses" ON worker_bonuses
  FOR SELECT USING (worker_id = auth.uid());

CREATE POLICY "Admins can manage all worker data" ON worker_performance
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE worker_performance;
ALTER PUBLICATION supabase_realtime ADD TABLE worker_bonuses;
