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
