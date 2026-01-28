import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activities";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get("booking_id");
    const userId = searchParams.get("user_id");

    let query = supabase.from("service_tracking").select("*").order("created_at", { ascending: true });

    if (bookingId) {
      query = query.eq("booking_id", bookingId);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (userId) {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id")
        .eq("user_id", userId);
      
      const bookingIds = bookings?.map(b => b.id) || [];
      const filtered = data?.filter(t => bookingIds.includes(t.booking_id)) || [];
      return NextResponse.json(filtered);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching service tracking:", error);
    return NextResponse.json({ error: "Failed to fetch service tracking" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id, stage, status, notes, image_url } = body;

    const { data, error } = await supabase
      .from("service_tracking")
      .insert({
        booking_id,
        stage,
        status: status || "pending",
        notes,
        image_url,
        started_at: status === "in_progress" ? new Date().toISOString() : null,
      })
      .select()
      .single();

      if (error) throw error;

      const { data: booking } = await supabase
        .from("bookings")
        .select("booking_id, customer_name")
        .eq("id", booking_id)
        .single();

      await logActivity({
        type: 'tracking',
        title: 'New Tracking Stage',
        description: `Stage ${stage} started for ${booking?.customer_name || 'Booking'} (${booking?.booking_id || ''})`,
        metadata: { booking_id: booking?.booking_id, stage, status: status || "pending" }
      });

      return NextResponse.json(data);
    } catch (error) {
      console.error("Error creating service tracking:", error);
      return NextResponse.json({ error: "Failed to create service tracking" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
      const body = await request.json();
      const { id, status, notes, image_url } = body;

      const updateData: Record<string, unknown> = { status };
      
      if (notes !== undefined) updateData.notes = notes;
      if (image_url !== undefined) updateData.image_url = image_url;
      
      if (status === "in_progress") {
        updateData.started_at = new Date().toISOString();
      } else if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("service_tracking")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      const { data: booking } = await supabase
        .from("bookings")
        .select("booking_id, customer_name")
        .eq("id", data.booking_id)
        .single();

      await logActivity({
        type: 'tracking',
        title: 'Tracking Status Update',
        description: `Stage ${data.stage} is now ${status} for ${booking?.customer_name || 'Booking'} (${booking?.booking_id || ''})`,
        metadata: { booking_id: booking?.booking_id, stage: data.stage, status }
      });

      return NextResponse.json(data);

  } catch (error) {
    console.error("Error updating service tracking:", error);
    return NextResponse.json({ error: "Failed to update service tracking" }, { status: 500 });
  }
}
