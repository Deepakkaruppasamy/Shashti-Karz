import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// POST /api/campaigns - Create campaign
export async function POST(request: NextRequest) {
    try {
        const adminSession = request.cookies.get("admin_session");
        const isAdmin = !!adminSession;

        const supabase = isAdmin ? await createServiceClient() : await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user && !isAdmin) {
            return NextResponse.json(
                { error: "Unauthorized: Please log in to access this resource" },
                { status: 401 }
            );
        }

        // Check admin role if authenticated via Supabase session but no admin cookie
        if (user && !isAdmin) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profile?.role !== "admin") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const body = await request.json();

        const { data, error } = await supabase
            .from("marketing_campaigns")
            .insert({
                ...body,
                created_by: user?.id || null,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Identify recipients
        if (data.status === "active") {
            await supabase.rpc("identify_campaign_recipients", {
                campaign_id_param: data.id,
            });
        }

        return NextResponse.json({ campaign: data });
    } catch (error) {
        console.error("Error creating campaign:", error);
        return NextResponse.json(
            { error: "Failed to create campaign" },
            { status: 500 }
        );
    }
}

// GET /api/campaigns - Get campaigns
export async function GET(request: NextRequest) {
    try {
        const adminSession = request.cookies.get("admin_session");
        const isAdmin = !!adminSession;

        const supabase = isAdmin ? await createServiceClient() : await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user && !isAdmin) {
            return NextResponse.json(
                { error: "Unauthorized: Please log in to access this resource" },
                { status: 401 }
            );
        }

        const { data, error } = await supabase
            .from("marketing_campaigns")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ campaigns: data });
    } catch (error) {
        console.error("Error fetching campaigns:", error);
        return NextResponse.json(
            { error: "Failed to fetch campaigns" },
            { status: 500 }
        );
    }
}
