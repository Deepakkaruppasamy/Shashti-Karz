import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("service_id");
    const status = searchParams.get("status") || "approved";

    try {
        let query = supabase
            .from("service_comments")
            .select(`
        *,
        service:services(name)
      `)
            .order("created_at", { ascending: false });

        if (serviceId) {
            query = query.eq("service_id", serviceId);
        }

        if (status !== "all") {
            query = query.eq("status", status);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const body = await request.json();

    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user profile
        const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, role")
            .eq("id", user.id)
            .single();

        const commentData = {
            service_id: body.service_id,
            parent_id: body.parent_id || null,
            user_id: user.id,
            user_name: profile?.full_name || user.email?.split('@')[0] || 'User',
            user_email: user.email,
            user_avatar: profile?.avatar_url,
            content: body.content,
            is_admin: profile?.role === 'admin',
            status: 'approved' // Auto-approve for now
        };

        const { data, error } = await supabase
            .from("service_comments")
            .insert(commentData)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const supabase = await createClient();
    const body = await request.json();

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("service_comments")
            .update({
                content: body.content,
                is_edited: true,
                edited_at: new Date().toISOString()
            })
            .eq("id", body.id)
            .eq("user_id", user.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user owns the comment or is admin
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        let query = supabase
            .from("service_comments")
            .delete()
            .eq("id", id!);

        // Non-admins can only delete their own comments
        if (profile?.role !== 'admin') {
            query = query.eq("user_id", user.id);
        }

        const { error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
