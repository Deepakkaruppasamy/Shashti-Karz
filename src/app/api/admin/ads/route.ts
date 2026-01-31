import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify admin role
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch all ads
        const { data: ads, error } = await supabase
            .from("ads")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, ads });

    } catch (error: any) {
        console.error("Error fetching ads:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch ads" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify admin role
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();

        // Validate required fields
        if (!body.title || !body.position || !body.media_url) {
            return NextResponse.json(
                { error: "Missing required fields (title, position, media_url)" },
                { status: 400 }
            );
        }

        const { data: newAd, error } = await supabase
            .from("ads")
            .insert({
                title: body.title,
                description: body.description,
                media_url: body.media_url,
                media_type: body.media_type || 'image',
                thumbnail_url: body.thumbnail_url,
                target_url: body.target_url,
                position: body.position,
                status: body.status || 'draft',
                start_date: body.start_date || null,
                end_date: body.end_date || null,
                priority: body.priority || 0
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, ad: newAd });

    } catch (error: any) {
        console.error("Error creating ad:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create ad" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify admin role
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        if (!body.id) {
            return NextResponse.json({ error: "Ad ID required" }, { status: 400 });
        }

        const { data: updatedAd, error } = await supabase
            .from("ads")
            .update({
                title: body.title,
                description: body.description,
                media_url: body.media_url,
                media_type: body.media_type,
                thumbnail_url: body.thumbnail_url,
                target_url: body.target_url,
                position: body.position,
                status: body.status,
                start_date: body.start_date,
                end_date: body.end_date,
                priority: body.priority
            })
            .eq("id", body.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, ad: updatedAd });

    } catch (error: any) {
        console.error("Error updating ad:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update ad" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify admin role
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Ad ID required" }, { status: 400 });
        }

        const { error } = await supabase
            .from("ads")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error deleting ad:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete ad" },
            { status: 500 }
        );
    }
}
