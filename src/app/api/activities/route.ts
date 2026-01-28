import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('system_activities')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        // Map to the format expected by the frontend
        const activities = data.map(a => ({
            id: a.id,
            type: a.type,
            title: a.title,
            description: a.description,
            timestamp: a.created_at,
            metadata: a.metadata
        }));

        return NextResponse.json(activities);
    } catch (error) {
        console.error('Failed to fetch activities:', error);
        return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }
}
