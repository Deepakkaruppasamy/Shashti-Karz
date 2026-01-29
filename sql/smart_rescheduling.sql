-- Smart Appointment Rescheduling System
-- AI-powered slot suggestions and weather-based rescheduling

-- Reschedule Requests
CREATE TABLE IF NOT EXISTS reschedule_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  original_date DATE NOT NULL,
  original_time TIME NOT NULL,
  requested_date DATE,
  requested_time TIME,
  reason TEXT NOT NULL CHECK (reason IN ('weather', 'personal', 'worker_unavailable', 'emergency', 'other')),
  reason_details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  suggested_slots JSONB, -- [{date: "2024-01-15", time: "10:00", score: 0.95}]
  approved_date DATE,
  approved_time TIME,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weather Data Cache
CREATE TABLE IF NOT EXISTS weather_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  location TEXT NOT NULL,
  condition TEXT, -- 'sunny', 'rainy', 'cloudy', 'stormy'
  temperature DECIMAL,
  precipitation_chance INTEGER,
  wind_speed DECIMAL,
  suitable_for_service BOOLEAN,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, location)
);

-- Reschedule Preferences
CREATE TABLE IF NOT EXISTS reschedule_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  auto_approve_weather BOOLEAN DEFAULT true,
  preferred_days TEXT[], -- ['monday', 'tuesday', 'wednesday']
  preferred_times TEXT[], -- ['morning', 'afternoon', 'evening']
  avoid_weekends BOOLEAN DEFAULT false,
  notification_channels TEXT[] DEFAULT ARRAY['email', 'sms'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to calculate slot score
CREATE OR REPLACE FUNCTION calculate_slot_score(
  slot_date DATE,
  slot_time TIME,
  user_id_param UUID,
  original_date DATE
)
RETURNS DECIMAL AS $$
DECLARE
  score DECIMAL := 0;
  prefs reschedule_preferences%ROWTYPE;
  day_name TEXT;
  time_period TEXT;
  date_diff INTEGER;
  weather_suitable BOOLEAN;
BEGIN
  -- Get user preferences
  SELECT * INTO prefs FROM reschedule_preferences WHERE user_id = user_id_param;
  
  -- Base score
  score := 0.5;
  
  -- Prefer dates close to original
  date_diff := ABS(slot_date - original_date);
  score := score + (1.0 / (1.0 + date_diff * 0.1));
  
  -- Check day preference
  day_name := LOWER(TO_CHAR(slot_date, 'Day'));
  IF prefs.preferred_days IS NOT NULL AND day_name = ANY(prefs.preferred_days) THEN
    score := score + 0.2;
  END IF;
  
  -- Check time preference
  time_period := CASE
    WHEN slot_time < '12:00' THEN 'morning'
    WHEN slot_time < '17:00' THEN 'afternoon'
    ELSE 'evening'
  END;
  IF prefs.preferred_times IS NOT NULL AND time_period = ANY(prefs.preferred_times) THEN
    score := score + 0.2;
  END IF;
  
  -- Check weather
  SELECT suitable_for_service INTO weather_suitable
  FROM weather_cache
  WHERE date = slot_date
  LIMIT 1;
  
  IF weather_suitable THEN
    score := score + 0.3;
  END IF;
  
  -- Weekend penalty if user avoids weekends
  IF prefs.avoid_weekends AND EXTRACT(DOW FROM slot_date) IN (0, 6) THEN
    score := score - 0.3;
  END IF;
  
  RETURN LEAST(score, 1.0);
END;
$$ LANGUAGE plpgsql;

-- Function to suggest alternative slots
CREATE OR REPLACE FUNCTION suggest_alternative_slots(
  booking_id_param UUID,
  num_suggestions INTEGER DEFAULT 3
)
RETURNS JSONB AS $$
DECLARE
  booking_record bookings%ROWTYPE;
  suggested_slots JSONB := '[]'::jsonb;
  slot_date DATE;
  slot_time TIME;
  slot_score DECIMAL;
  i INTEGER := 0;
BEGIN
  SELECT * INTO booking_record FROM bookings WHERE id = booking_id_param;
  
  -- Generate suggestions for next 14 days
  FOR slot_date IN 
    SELECT generate_series(
      CURRENT_DATE + 1,
      CURRENT_DATE + 14,
      '1 day'::interval
    )::date
  LOOP
    -- Check multiple time slots per day
    FOREACH slot_time IN ARRAY ARRAY['09:00'::time, '11:00'::time, '14:00'::time, '16:00'::time]
    LOOP
      -- Check if slot is available
      IF NOT EXISTS (
        SELECT 1 FROM bookings 
        WHERE date = slot_date::text 
        AND time = slot_time::text 
        AND status NOT IN ('cancelled', 'completed')
      ) THEN
        -- Calculate score
        slot_score := calculate_slot_score(
          slot_date,
          slot_time,
          booking_record.user_id,
          booking_record.date::date
        );
        
        -- Add to suggestions
        suggested_slots := suggested_slots || jsonb_build_object(
          'date', slot_date,
          'time', slot_time,
          'score', slot_score,
          'day_name', TO_CHAR(slot_date, 'Day'),
          'available', true
        );
        
        i := i + 1;
        IF i >= num_suggestions * 3 THEN
          EXIT;
        END IF;
      END IF;
    END LOOP;
    
    IF i >= num_suggestions * 3 THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- Sort by score and return top N
  RETURN (
    SELECT jsonb_agg(slot ORDER BY (slot->>'score')::decimal DESC)
    FROM (
      SELECT jsonb_array_elements(suggested_slots) as slot
    ) sub
    LIMIT num_suggestions
  );
END;
$$ LANGUAGE plpgsql;

-- Function to auto-approve weather-based reschedules
CREATE OR REPLACE FUNCTION auto_approve_weather_reschedule()
RETURNS TRIGGER AS $$
DECLARE
  weather_record weather_cache%ROWTYPE;
  user_prefs reschedule_preferences%ROWTYPE;
BEGIN
  -- Check if reason is weather
  IF NEW.reason = 'weather' THEN
    -- Get user preferences
    SELECT * INTO user_prefs 
    FROM reschedule_preferences 
    WHERE user_id = NEW.user_id;
    
    -- Check if auto-approve is enabled
    IF user_prefs.auto_approve_weather THEN
      -- Verify weather is actually bad
      SELECT * INTO weather_record
      FROM weather_cache
      WHERE date = NEW.original_date
      LIMIT 1;
      
      IF weather_record.suitable_for_service = false THEN
        -- Auto-approve
        NEW.status := 'auto_approved';
        NEW.approved_at := NOW();
        
        -- Use first suggested slot if available
        IF NEW.suggested_slots IS NOT NULL AND jsonb_array_length(NEW.suggested_slots) > 0 THEN
          NEW.approved_date := (NEW.suggested_slots->0->>'date')::date;
          NEW.approved_time := (NEW.suggested_slots->0->>'time')::time;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-approval
CREATE TRIGGER auto_approve_weather_trigger
  BEFORE INSERT ON reschedule_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_weather_reschedule();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_booking ON reschedule_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_user ON reschedule_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_status ON reschedule_requests(status);
CREATE INDEX IF NOT EXISTS idx_weather_cache_date ON weather_cache(date);

-- Enable RLS
ALTER TABLE reschedule_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE reschedule_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reschedule requests" ON reschedule_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create reschedule requests" ON reschedule_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view weather data" ON weather_cache
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own preferences" ON reschedule_preferences
  FOR ALL USING (user_id = auth.uid());

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE reschedule_requests;
