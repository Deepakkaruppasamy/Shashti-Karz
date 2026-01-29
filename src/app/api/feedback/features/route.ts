import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/feedback/features - Submit feature request
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const { data, error } = await supabase
            .from("feature_requests")
            .insert({
                ...body,
                user_id: user.id,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ feature: data });
    } catch (error) {
        console.error("Error submitting feature request:", error);
        return NextResponse.json(
            { error: "Failed to submit feature request" },
            { status: 500 }
        );
    }
}

// GET /api/feedback/features - Get feature requests
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("feature_requests")
            .select(`
        *,
        user:profiles(id, full_name)
      `)
            .order("votes", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ features: data });
    } catch (error) {
        console.error("Error fetching features:", error);
        return NextResponse.json(
            { error: "Failed to fetch features" },
            { status: 500 }
        );
    }
}
