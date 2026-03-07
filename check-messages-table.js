
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function loadEnv() {
    const content = fs.readFileSync('.env.local', 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            env[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
    return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTable() {
    const { error } = await supabase.from("ai_chat_messages").select("count").limit(1);
    if (error) {
        console.log("ai_chat_messages table status:", error.message);
    } else {
        console.log("ai_chat_messages table exists!");
    }
}

checkTable();
