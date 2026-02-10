import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    // Check if already liked
    const { data: existingLike } = await supabase
        .from("showroom_post_likes")
        .select("id")
        .eq("post_id", id)
        .eq("user_id", user.id)
        .single();

    if (existingLike) {
        // Unlike
        const { error } = await supabase
            .from("showroom_post_likes")
            .delete()
            .eq("post_id", id)
            .eq("user_id", user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ liked: false });
    } else {
        // Like
        const { error } = await supabase
            .from("showroom_post_likes")
            .insert({
                post_id: id,
                user_id: user.id
            });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ liked: true });
    }
}
