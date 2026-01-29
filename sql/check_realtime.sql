-- Quick Check: What's Already Enabled for Real-time
-- Run this to see which tables have real-time enabled

SELECT 
  schemaname,
  tablename
FROM 
  pg_publication_tables
WHERE 
  pubname = 'supabase_realtime'
ORDER BY 
  tablename;

-- This will show you all tables that already have real-time enabled
