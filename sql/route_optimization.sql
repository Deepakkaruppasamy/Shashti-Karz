-- Route Optimization & Worker Routing
-- Google Maps integration, route planning, and ETA tracking

-- Worker Routes
CREATE TABLE IF NOT EXISTS worker_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES profiles(id),
  route_date DATE NOT NULL,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  total_distance_km DECIMAL,
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  fuel_cost_estimate DECIMAL,
  optimized BOOLEAN DEFAULT false,
  route_data JSONB, -- Google Maps route response
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(worker_id, route_date)
);

-- Route Stops (Bookings in route)
CREATE TABLE IF NOT EXISTS route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES worker_routes(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id),
  stop_order INTEGER NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL,
  longitude DECIMAL,
  estimated_arrival TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'en_route', 'arrived', 'completed', 'skipped')),
  distance_from_previous_km DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Traffic Updates
CREATE TABLE IF NOT EXISTS traffic_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES worker_routes(id),
  location_lat DECIMAL NOT NULL,
  location_lng DECIMAL NOT NULL,
  traffic_level TEXT CHECK (traffic_level IN ('light', 'moderate', 'heavy', 'severe')),
  delay_minutes INTEGER DEFAULT 0,
  alternative_route_suggested BOOLEAN DEFAULT false,
  alternative_route_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker Locations (Real-time tracking)
CREATE TABLE IF NOT EXISTS worker_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES profiles(id),
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  accuracy_meters DECIMAL,
  speed_kmh DECIMAL,
  heading_degrees DECIMAL,
  battery_level INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ETA Notifications
CREATE TABLE IF NOT EXISTS eta_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  estimated_arrival TIMESTAMPTZ NOT NULL,
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to optimize route
CREATE OR REPLACE FUNCTION optimize_worker_route(
  worker_id_param UUID,
  route_date_param DATE
)
RETURNS JSONB AS $$
DECLARE
  bookings_cursor CURSOR FOR
    SELECT b.id, b.address, b.latitude, b.longitude, b.time
    FROM bookings b
    WHERE b.worker_id = worker_id_param
      AND b.date::date = route_date_param
      AND b.status IN ('confirmed', 'in_progress')
    ORDER BY b.time;
  
  route_id UUID;
  stop_counter INTEGER := 0;
  total_distance DECIMAL := 0;
  prev_lat DECIMAL;
  prev_lng DECIMAL;
  optimized_stops JSONB := '[]'::jsonb;
BEGIN
  -- Create or get route
  INSERT INTO worker_routes (worker_id, route_date, optimized)
  VALUES (worker_id_param, route_date_param, true)
  ON CONFLICT (worker_id, route_date) DO UPDATE SET optimized = true
  RETURNING id INTO route_id;
  
  -- Delete existing stops
  DELETE FROM route_stops WHERE route_id = route_id;
  
  -- Add stops in optimized order
  FOR booking_rec IN bookings_cursor LOOP
    stop_counter := stop_counter + 1;
    
    -- Calculate distance from previous stop
    IF prev_lat IS NOT NULL THEN
      -- Simple distance calculation (in real implementation, use Google Maps Distance Matrix API)
      total_distance := total_distance + 
        (ABS(booking_rec.latitude - prev_lat) + ABS(booking_rec.longitude - prev_lng)) * 111; -- Rough km conversion
    END IF;
    
    -- Insert stop
    INSERT INTO route_stops (
      route_id, booking_id, stop_order, address, latitude, longitude,
      estimated_arrival, distance_from_previous_km
    ) VALUES (
      route_id, booking_rec.id, stop_counter, booking_rec.address,
      booking_rec.latitude, booking_rec.longitude,
      route_date_param::timestamp + (booking_rec.time::time - '00:00:00'::time),
      CASE WHEN prev_lat IS NULL THEN 0 ELSE 
        (ABS(booking_rec.latitude - prev_lat) + ABS(booking_rec.longitude - prev_lng)) * 111
      END
    );
    
    prev_lat := booking_rec.latitude;
    prev_lng := booking_rec.longitude;
    
    optimized_stops := optimized_stops || jsonb_build_object(
      'booking_id', booking_rec.id,
      'order', stop_counter,
      'address', booking_rec.address
    );
  END LOOP;
  
  -- Update route totals
  UPDATE worker_routes
  SET total_distance_km = total_distance,
      estimated_duration_minutes = stop_counter * 60 + (total_distance / 30 * 60) -- Assume 30 km/h average
  WHERE id = route_id;
  
  RETURN jsonb_build_object(
    'route_id', route_id,
    'total_stops', stop_counter,
    'total_distance_km', total_distance,
    'stops', optimized_stops
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update worker location
CREATE OR REPLACE FUNCTION update_worker_location(
  worker_id_param UUID,
  lat DECIMAL,
  lng DECIMAL,
  accuracy DECIMAL DEFAULT NULL,
  speed DECIMAL DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO worker_locations (worker_id, latitude, longitude, accuracy_meters, speed_kmh)
  VALUES (worker_id_param, lat, lng, accuracy, speed);
  
  -- Clean up old locations (keep last 24 hours)
  DELETE FROM worker_locations
  WHERE worker_id = worker_id_param
    AND timestamp < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate ETA
CREATE OR REPLACE FUNCTION calculate_eta(
  worker_id_param UUID,
  booking_id_param UUID
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  worker_lat DECIMAL;
  worker_lng DECIMAL;
  booking_lat DECIMAL;
  booking_lng DECIMAL;
  distance_km DECIMAL;
  eta TIMESTAMPTZ;
BEGIN
  -- Get worker's current location
  SELECT latitude, longitude INTO worker_lat, worker_lng
  FROM worker_locations
  WHERE worker_id = worker_id_param
  ORDER BY timestamp DESC
  LIMIT 1;
  
  -- Get booking location
  SELECT latitude, longitude INTO booking_lat, booking_lng
  FROM bookings
  WHERE id = booking_id_param;
  
  -- Calculate distance (simple calculation, use Google Maps in production)
  distance_km := (ABS(booking_lat - worker_lat) + ABS(booking_lng - worker_lng)) * 111;
  
  -- Calculate ETA (assume 30 km/h average speed)
  eta := NOW() + (distance_km / 30 * INTERVAL '1 hour');
  
  -- Store ETA notification
  INSERT INTO eta_notifications (booking_id, user_id, estimated_arrival)
  SELECT booking_id_param, user_id, eta
  FROM bookings
  WHERE id = booking_id_param;
  
  RETURN eta;
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_worker_routes_worker_date ON worker_routes(worker_id, route_date);
CREATE INDEX IF NOT EXISTS idx_route_stops_route ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_worker_locations_worker ON worker_locations(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_locations_timestamp ON worker_locations(timestamp);

-- Enable RLS
ALTER TABLE worker_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE eta_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Workers can view their own routes" ON worker_routes
  FOR SELECT USING (worker_id = auth.uid());

CREATE POLICY "Workers can view their own stops" ON route_stops
  FOR SELECT USING (
    route_id IN (SELECT id FROM worker_routes WHERE worker_id = auth.uid())
  );

CREATE POLICY "Workers can update their location" ON worker_locations
  FOR INSERT WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Users can view their ETA notifications" ON eta_notifications
  FOR SELECT USING (user_id = auth.uid());

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE worker_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE eta_notifications;
