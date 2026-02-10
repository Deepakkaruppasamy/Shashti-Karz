import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("showroom_posts")
        .select(`
      *,
      user:profiles!user_id(*),
      vehicle:user_vehicles(*)
    `)
        .eq("id", id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Increment view count
    await supabase
        .from("showroom_posts")
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq("id", id);

    // Check if user liked this post
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: like } = await supabase
            .from("showroom_post_likes")
            .select("id")
            .eq("post_id", id)
            .eq("user_id", user.id)
            .single();

        data.is_liked = !!like;
    }

    return NextResponse.json(data);
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Check ownership
    const { data: post } = await supabase
        .from("showroom_posts")
        .select("user_id")
        .eq("id", id)
        .single();

    if (!post || post.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
        .from("showroom_posts")
        .update(body)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check ownership
    const { data: post } = await supabase
        .from("showroom_posts")
        .select("user_id")
        .eq("id", id)
        .single();

    if (!post || post.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
        .from("showroom_posts")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
