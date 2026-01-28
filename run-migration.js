const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running migration...');
  
  // Note: supabase.rpc() or direct query if possible. 
  // Since I can't run arbitrary SQL easily via supabase-js without a stored procedure,
  // I'll try to check if I can at least create a table using a common RPC if it exists,
  // or I'll just rely on the fact that I can't change the schema and I'll use JSONB fields
  // if I can find a way to add them, or just store data in an existing flexible table like 'notifications' or 'analytics_snapshots'.

  // Let's try to see if there's a 'postgres' RPC which is common in some setups
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: `
      ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS health_summary JSONB;
      ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS resale_report JSONB;
      CREATE TABLE IF NOT EXISTS system_alerts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          type VARCHAR(50) NOT NULL,
          severity VARCHAR(20) DEFAULT 'medium',
          title TEXT NOT NULL,
          description TEXT,
          data JSONB,
          resolved BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_failure_logs JSONB;
    `
  });

  if (error) {
    console.error('Migration failed:', error);
    // If rpc fails, we might need another way.
  } else {
    console.log('Migration successful:', data);
  }
}

runMigration();
