import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/bookings/[id]/reschedule - Request reschedule
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

        const body = await request.json();
        const { reason, reason_details, requested_date, requested_time } = body;

        // Get booking
        const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .select("*")
            .eq("id", params.id)
            .single();

        if (bookingError || !booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // Generate suggested slots
        const { data: suggestionsData } = await supabase.rpc(
            "suggest_alternative_slots",
            {
                booking_id_param: params.id,
                num_suggestions: 5,
            }
        );

        // Create reschedule request
        const { data, error } = await supabase
            .from("reschedule_requests")
            .insert({
                booking_id: params.id,
                user_id: user.id,
                original_date: booking.date,
                original_time: booking.time,
                requested_date,
                requested_time,
                reason,
                reason_details,
                suggested_slots: suggestionsData || [],
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Send notification
        await supabase.from("notifications").insert({
            user_id: user.id,
            type: "booking_rescheduled",
            category: "booking",
            title: "Reschedule Request Submitted",
            message: `Your reschedule request for booking #${booking.booking_id} has been submitted.`,
            data: { booking_id: params.id, reschedule_id: data.id },
            channels: ["in_app", "email"],
            priority: "medium",
        });

        return NextResponse.json({ reschedule: data });
    } catch (error) {
        console.error("Error creating reschedule request:", error);
        return NextResponse.json(
            { error: "Failed to create reschedule request" },
            { status: 500 }
        );
    }
}

// GET /api/bookings/[id]/reschedule - Get reschedule requests for booking
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("reschedule_requests")
            .select("*")
            .eq("booking_id", params.id)
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ reschedules: data });
    } catch (error) {
        console.error("Error fetching reschedule requests:", error);
        return NextResponse.json(
            { error: "Failed to fetch reschedule requests" },
            { status: 500 }
        );
    }
}
