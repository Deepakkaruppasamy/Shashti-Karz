import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendBookingNotification, sendAdminNotification } from "@/lib/notification-service";
import { logActivity } from "@/lib/activities";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const userId = searchParams.get("user_id");

  let query = supabase
    .from("bookings")
    .select("*, service:services(*)")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const bookingId = `BK${Date.now().toString().slice(-6)}`;

  const { data, error } = await supabase
    .from("bookings")
    .insert({ ...body, booking_id: bookingId })
    .select("*, service:services(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

    try {
      await sendBookingNotification(
        data.id,
        "created",
        data.user_id,
        {
          serviceName: data.service?.name || body.service_name || "Service",
          date: data.date,
          time: data.time,
          price: data.price,
          customerName: data.customer_name,
          customerEmail: data.customer_email,
        }
      );

    await sendAdminNotification("new_booking", {
      bookingId: data.id,
      customerName: data.customer_name,
      serviceName: data.service?.name || body.service_name || "Service",
      price: data.price,
      date: data.date,
      time: data.time,
    });

    if (data.price >= 15000) {
        await sendAdminNotification("high_value", {
          bookingId: data.id,
          customerName: data.customer_name,
          serviceName: data.service?.name || body.service_name || "Service",
          price: data.price,
        });
      }

      await logActivity({
        type: 'booking',
        title: 'New Booking Created',
        description: `${data.customer_name} booked ${data.service?.name || 'a service'} for ₹${data.price}`,
        metadata: { booking_id: data.booking_id, id: data.id }
      });
    } catch (notifError) {

    console.error("Failed to send notification:", notifError);
  }

  return NextResponse.json(data);
}
