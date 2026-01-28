
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_string: `
      -- Update reviews table
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS sentiment_score NUMERIC;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS sentiment_label TEXT;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}';
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_repeat_customer BOOLEAN DEFAULT FALSE;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS recommend BOOLEAN DEFAULT TRUE;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS abuse_score NUMERIC DEFAULT 0;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id);

      -- Create service_ai_stats table
      CREATE TABLE IF NOT EXISTS service_ai_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id UUID REFERENCES services(id) UNIQUE,
        weighted_rating NUMERIC(3, 1) DEFAULT 0.0,
        confidence_level TEXT DEFAULT 'Low',
        total_reviews INTEGER DEFAULT 0,
        sentiment_summary JSONB DEFAULT '{}',
        trend_indicator TEXT DEFAULT 'consistent',
        last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enable Realtime
      ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
      ALTER PUBLICATION supabase_realtime ADD TABLE service_ai_stats;
    `
  })

  if (error) {
    // If rpc exec_sql doesn't exist, we might need to use a different approach or just direct SQL if we had access.
    // Since we don't have direct SQL, let's try to run this via a migration-like script if possible.
    console.error('Error running SQL:', error)
    
    // Alternative: Try to just use the supabase client to create table/columns if possible (not possible for DDL usually)
  } else {
    console.log('SQL executed successfully')
  }
}

run()
