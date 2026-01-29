-- Minimal Real-time Setup - Only Existing Tables
-- This script only enables real-time for tables that exist in your database

-- 1. Enable real-time for existing core tables
DO $$
BEGIN
  -- service_tracking
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_tracking') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE service_tracking;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
  
  -- workers
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workers') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE workers;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
  
  -- reviews
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
  
  -- payments
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE payments;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
  
  -- profiles
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
  
  -- services
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE services;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
  
  -- gallery
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gallery') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE gallery;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
  
  -- notifications
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- 2. Set replica identity for existing tables
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    ALTER TABLE bookings REPLICA IDENTITY FULL;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_tracking') THEN
    ALTER TABLE service_tracking REPLICA IDENTITY FULL;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workers') THEN
    ALTER TABLE workers REPLICA IDENTITY FULL;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    ALTER TABLE reviews REPLICA IDENTITY FULL;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    ALTER TABLE notifications REPLICA IDENTITY FULL;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE profiles REPLICA IDENTITY FULL;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    ALTER TABLE payments REPLICA IDENTITY FULL;
  END IF;
END $$;

-- 3. Create online_users table
CREATE TABLE IF NOT EXISTS online_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  page TEXT,
  UNIQUE(user_id)
);

-- Enable real-time for online_users
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE online_users;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

ALTER TABLE online_users REPLICA IDENTITY FULL;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_online_users_last_seen ON online_users(last_seen);
CREATE INDEX IF NOT EXISTS idx_online_users_role ON online_users(role);

-- 5. Function to update last seen
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger for online_users
DROP TRIGGER IF EXISTS update_online_users_last_seen ON online_users;
CREATE TRIGGER update_online_users_last_seen
BEFORE UPDATE ON online_users
FOR EACH ROW EXECUTE FUNCTION update_last_seen();

-- 7. Cleanup function
CREATE OR REPLACE FUNCTION cleanup_offline_users()
RETURNS void AS $$
BEGIN
  DELETE FROM online_users
  WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- 8. Analytics notification function
CREATE OR REPLACE FUNCTION notify_analytics_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'analytics_update',
    json_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', NOW()
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create triggers for existing tables
DO $$
BEGIN
  -- Bookings trigger
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    DROP TRIGGER IF EXISTS bookings_analytics_trigger ON bookings;
    CREATE TRIGGER bookings_analytics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW EXECUTE FUNCTION notify_analytics_update();
  END IF;
  
  -- Payments trigger
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    DROP TRIGGER IF EXISTS payments_analytics_trigger ON payments;
    CREATE TRIGGER payments_analytics_trigger
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION notify_analytics_update();
  END IF;
END $$;

-- 10. Grant permissions
GRANT ALL ON online_users TO authenticated;
GRANT ALL ON online_users TO service_role;

-- Success!
DO $$
BEGIN
  RAISE NOTICE '✅ Real-time setup completed successfully!';
  RAISE NOTICE '✅ All existing tables are now enabled for real-time updates.';
  RAISE NOTICE '✅ online_users table created.';
  RAISE NOTICE '🚀 Your admin panel is ready to use!';
END $$;
