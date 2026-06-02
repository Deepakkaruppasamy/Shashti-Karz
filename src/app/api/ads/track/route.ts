import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { adId, eventType } = body;

        if (!adId || !eventType || !['impression', 'click'].includes(eventType)) {
            return NextResponse.json({ error: "Invalid tracking data" }, { status: 400 });
        }


        console.log(`[AdTracking] ${eventType} for ${adId}`);


        return NextResponse.json({ success: true, mocked: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
