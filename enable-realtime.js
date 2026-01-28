const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function enableRealtime() {
  console.log('Enabling Realtime for service_tracking...');
  
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' 
          AND tablename = 'service_tracking'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE service_tracking;
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' 
          AND tablename = 'bookings'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
        END IF;
      END $$;
    `
  });

  if (error) {
    console.error('Failed to enable Realtime via RPC:', error);
    console.log('Trying direct publication check...');
    // Fallback or just report failure
  } else {
    console.log('Realtime enabled successfully:', data);
  }
}

enableRealtime();
