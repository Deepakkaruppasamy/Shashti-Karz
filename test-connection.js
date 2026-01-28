const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing connection to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const { data, error } = await supabase.from('services').select('*').limit(1);
    if (error) {
      console.error('Supabase Error:', error.message);
    } else {
      console.log('Success! Found', data.length, 'services');
    }
  } catch (err) {
    console.error('Unexpected Error:', err.message);
  }
}

test();
