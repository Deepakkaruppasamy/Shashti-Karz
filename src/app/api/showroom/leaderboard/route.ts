import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "50");
    const period = searchParams.get("period") || "all"; // all, monthly

    let query = supabase
        .from("referral_leaderboard")
        .select(`
      *,
      user:profiles!user_id(*)
    `)
        .order("current_rank", { ascending: true, nullsFirst: false })
        .limit(limit);

    if (period === "monthly") {
        query = query.order("monthly_referrals", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
