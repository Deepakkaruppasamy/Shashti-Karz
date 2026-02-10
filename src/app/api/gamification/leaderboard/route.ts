import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get("limit") || "10");

        // Try to fetch from customer_leaderboard which has points, bookings, etc.
        const { data, error } = await supabase
            .from("customer_leaderboard")
            .select(`
                *,
                user:profiles(id, full_name, avatar_url)
            `)
            .order("rank", { ascending: true })
            .limit(limit);

        if (error) {
            console.error("Supabase Error [Customer Leaderboard]:", error);

            // Fallback to simpler select if profiles join fails
            const { data: simpleData, error: simpleError } = await supabase
                .from("customer_leaderboard")
                .select("*")
                .order("rank", { ascending: true })
                .limit(limit);

            if (simpleError) {
                return NextResponse.json({ error: simpleError.message }, { status: 500 });
            }
            return NextResponse.json({ leaderboard: simpleData });
        }

        return NextResponse.json({ leaderboard: data });
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return NextResponse.json(
            { error: "Failed to fetch leaderboard" },
            { status: 500 }
        );
    }
}
