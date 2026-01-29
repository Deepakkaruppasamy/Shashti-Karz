import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();
    const body = await request.json();

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if already liked
        const { data: existing } = await supabase
            .from("comment_likes")
            .select("id")
            .eq("comment_id", body.comment_id)
            .eq("user_id", user.id)
            .single();

        if (existing) {
            // Unlike
            const { error } = await supabase
                .from("comment_likes")
                .delete()
                .eq("comment_id", body.comment_id)
                .eq("user_id", user.id);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ liked: false });
        } else {
            // Like
            const { error } = await supabase
                .from("comment_likes")
                .insert({
                    comment_id: body.comment_id,
                    user_id: user.id
                });

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ liked: true });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
