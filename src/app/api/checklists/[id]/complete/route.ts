import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/checklists/[id]/complete - Complete a checklist for a booking
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const checklistId = params.id;
        const body = await request.json();
        const { booking_id, completed_items, photos, notes } = body;

        if (!booking_id || !completed_items) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get worker ID from profiles
        const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        // Check if completion already exists
        const { data: existing } = await supabase
            .from("checklist_completions")
            .select("id")
            .eq("booking_id", booking_id)
            .eq("checklist_id", checklistId)
            .single();

        let result;

        if (existing) {
            // Update existing completion
            const { data, error } = await supabase
                .from("checklist_completions")
                .update({
                    completed_items,
                    photos,
                    notes,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", existing.id)
                .select()
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            result = data;
        } else {
            // Create new completion
            const { data, error } = await supabase
                .from("checklist_completions")
                .insert({
                    booking_id,
                    checklist_id: checklistId,
                    worker_id: user.id,
                    completed_items,
                    photos,
                    notes,
                })
                .select()
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            result = data;
        }

        return NextResponse.json({ completion: result });
    } catch (error) {
        console.error("Error completing checklist:", error);
        return NextResponse.json(
            { error: "Failed to complete checklist" },
            { status: 500 }
        );
    }
}

// GET /api/checklists/[id]/complete - Get completion status for a booking
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;
        const bookingId = searchParams.get("booking_id");

        if (!bookingId) {
            return NextResponse.json(
                { error: "booking_id is required" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("checklist_completions")
            .select(`
        *,
        checklist:service_checklists(*),
        worker:workers(*)
      `)
            .eq("booking_id", bookingId)
            .eq("checklist_id", params.id)
            .single();

        if (error && error.code !== "PGRST116") {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ completion: data });
    } catch (error) {
        console.error("Error fetching completion:", error);
        return NextResponse.json(
            { error: "Failed to fetch completion" },
            { status: 500 }
        );
    }
}

// PUT /api/checklists/[id]/complete - Approve checklist (manager only)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin or manager
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (!profile || !["admin", "manager"].includes(profile.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { completion_id, approved } = body;

        if (!completion_id || approved === undefined) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("checklist_completions")
            .update({
                manager_approved: approved,
                approved_by: approved ? user.id : null,
                approved_at: approved ? new Date().toISOString() : null,
            })
            .eq("id", completion_id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ completion: data });
    } catch (error) {
        console.error("Error approving checklist:", error);
        return NextResponse.json(
            { error: "Failed to approve checklist" },
            { status: 500 }
        );
    }
}
