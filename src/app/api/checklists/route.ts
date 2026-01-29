import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/checklists - Get all checklist templates
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;
        const serviceId = searchParams.get("service_id");

        let query = supabase
            .from("service_checklists")
            .select("*")
            .eq("active", true)
            .order("created_at", { ascending: false });

        if (serviceId) {
            query = query.eq("service_id", serviceId);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ checklists: data });
    } catch (error) {
        console.error("Error fetching checklists:", error);
        return NextResponse.json(
            { error: "Failed to fetch checklists" },
            { status: 500 }
        );
    }
}

// POST /api/checklists - Create new checklist template (admin only)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { service_id, name, description, items } = body;

        if (!service_id || !name || !items) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("service_checklists")
            .insert({
                service_id,
                name,
                description,
                items,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ checklist: data }, { status: 201 });
    } catch (error) {
        console.error("Error creating checklist:", error);
        return NextResponse.json(
            { error: "Failed to create checklist" },
            { status: 500 }
        );
    }
}
