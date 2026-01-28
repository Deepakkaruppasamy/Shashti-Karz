import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendBookingNotification } from "@/lib/notification-service";
import { logActivity } from "@/lib/activities";
import { updateLoyaltyPoints } from "@/lib/loyalty";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select("*, service:services(*)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const { data: oldData } = await supabase
    .from("bookings")
    .select("*, service:services(*)")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("bookings")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, service:services(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    if (oldData && data.status !== oldData.status) {
      if (data.status === "approved") {
        await sendBookingNotification(
          data.id,
          "approved",
          data.user_id,
          {
            serviceName: data.service?.name || "Service",
            date: data.date,
            time: data.time,
            price: data.price,
            customerName: data.customer_name,
          }
        );
        } else if (data.status === "completed") {
          try {
            await updateLoyaltyPoints(
              data.user_id,
              data.id,
              data.price,
              "earned",
              `Earned for booking ${data.booking_id}`
            );
          } catch (loyaltyError) {
            console.error("Failed to update loyalty points:", loyaltyError);
          }

          await sendBookingNotification(

          data.id,
          "completed",
          data.user_id,
          {
            serviceName: data.service?.name || "Service",
            date: data.date,
            time: data.time,
            price: data.price,
            customerName: data.customer_name,
          }
        );
        } else if (data.status === "cancelled") {
          await sendBookingNotification(
            data.id,
            "cancelled",
            data.user_id,
            {
              serviceName: data.service?.name || "Service",
              date: data.date,
              time: data.time,
              price: data.price,
              customerName: data.customer_name,
            }
          );
        }

        await logActivity({
          type: 'booking',
          title: `Booking ${data.status.toUpperCase()}`,
          description: `Booking ${data.booking_id} for ${data.customer_name} is now ${data.status}`,
          metadata: { booking_id: data.booking_id, id: data.id, status: data.status }
        });
      }
    } catch (notifError) {

    console.error("Failed to send notification:", notifError);
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
