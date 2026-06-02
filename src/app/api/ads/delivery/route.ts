import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const position = searchParams.get("position");

        if (!position) {
            return NextResponse.json({ error: "Position required" }, { status: 400 });
        }

        const now = new Date().toISOString();

        const { data: ad, error } = await supabase
            .from("ads")
            .select("id, title, description, media_url, media_type, thumbnail_url, target_url, metadata")
            .eq("position", position)
            .eq("status", "active")
            .order("priority", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("Ad delivery error", error);
            return NextResponse.json({ ad: null });
        }

        return NextResponse.json({ ad });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
