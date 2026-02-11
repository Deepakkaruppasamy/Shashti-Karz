import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("showroom_post_comments")
        .select(`
            *,
            user:profiles!user_id(*)
        `)
        .eq("post_id", id)
        .eq("status", "active")
        .order("created_at", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { comment, parent_comment_id } = await request.json();

    const { data, error } = await supabase
        .from("showroom_post_comments")
        .insert({
            post_id: id,
            user_id: user.id,
            comment,
            parent_comment_id,
            status: "active"
        })
        .select(`
            *,
            user:profiles!user_id(*)
        `)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
