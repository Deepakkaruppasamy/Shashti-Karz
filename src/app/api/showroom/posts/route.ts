import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || "approved";
    const userId = searchParams.get("user_id");
    const contestId = searchParams.get("contest_id");
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
        .from("showroom_posts")
        .select(`
      *,
      user:profiles!user_id(*),
      vehicle:user_vehicles(*)
    `)
        .order("created_at", { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

    if (status) {
        query = query.eq("status", status);
    }

    if (userId) {
        query = query.eq("user_id", userId);
    }

    if (contestId) {
        query = query.eq("contest_id", contestId);
    }

    if (featured === "true") {
        query = query.eq("featured", true).order("featured_order", { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get current user's likes if authenticated
    const { data: { user } } = await supabase.auth.getUser();

    if (user && data) {
        const postIds = data.map(p => p.id);
        const { data: likes } = await supabase
            .from("showroom_post_likes")
            .select("post_id")
            .in("post_id", postIds)
            .eq("user_id", user.id);

        const likedPostIds = new Set(likes?.map(l => l.post_id) || []);

        data.forEach((post: any) => {
            post.is_liked = likedPostIds.has(post.id);
        });
    }

    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Ensure user_id matches authenticated user
    body.user_id = user.id;

    // Set default status to pending for moderation
    if (!body.status) {
        body.status = "pending";
    }

    const { data, error } = await supabase
        .from("showroom_posts")
        .insert(body)
        .select(`
      *,
      user:profiles!user_id(*),
      vehicle:user_vehicles(*)
    `)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update user stats
    await supabase.rpc('increment', {
        table_name: 'showroom_user_stats',
        column_name: 'total_posts',
        user_id: user.id
    }).catch(() => { });

    return NextResponse.json(data);
}
