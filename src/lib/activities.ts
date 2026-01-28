import { supabase } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";

export type ActivityType = 'booking' | 'finance' | 'tracking' | 'inventory' | 'system' | 'user';

export async function logActivity(activity: {
    type: ActivityType;
    title: string;
    description: string;
    metadata?: any;
}) {
    try {
        // Use service role if possible, but here we'll use the provided client or server client
        // For simplicity in this project, we'll use the server client if called from server, 
        // or client-side supabase if called from client.
        
        // Since this might be called from both, let's detect
        if (typeof window === 'undefined') {
            const serverSupabase = await createClient();
            await serverSupabase.from('system_activities').insert([activity]);
        } else {
            await supabase.from('system_activities').insert([activity]);
        }
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}
