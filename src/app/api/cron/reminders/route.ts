import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendEmail,
  generateReminderEmail,
} from "@/lib/email-service";
import { sendNotification } from "@/lib/notification-service";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/cron/reminders
 *
 * Scheduled daily by Vercel Cron (see vercel.json).
 * Finds all active bookings scheduled for tomorrow and
 * sends an appointment reminder email + in-app notification
 * to each customer.
 *
 * Protected by CRON_SECRET so only Vercel can call it.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent public abuse
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Calculate tomorrow's date in YYYY-MM-DD format
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  console.log(`[Reminders Cron] Running for date: ${tomorrowStr}`);

  // Fetch all bookings scheduled for tomorrow that are active (not cancelled/completed)
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*, service:services(*)")
    .eq("date", tomorrowStr)
    .in("status", ["pending", "approved", "confirmed"]);

  if (error) {
    console.error("[Reminders Cron] DB error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch bookings", details: error.message },
      { status: 500 }
    );
  }

  if (!bookings || bookings.length === 0) {
    console.log("[Reminders Cron] No bookings found for tomorrow.");
    return NextResponse.json({ success: true, sent: 0, message: "No bookings tomorrow" });
  }

  console.log(`[Reminders Cron] Found ${bookings.length} booking(s) to remind.`);

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const booking of bookings) {
    const serviceName = booking.service?.name || "Car Detailing";
    const customerName = booking.customer_name || "Valued Customer";
    const customerEmail = booking.customer_email;
    const bookingTime = booking.time || "10:00 AM";

    try {
      // 1. Send reminder email directly to the customer's email
      if (customerEmail) {
        const html = generateReminderEmail({
          customerName,
          serviceName,
          date: tomorrowStr,
          time: bookingTime,
        });

        const result = await sendEmail({
          to: customerEmail,
          subject: `Reminder: Your ${serviceName} appointment is tomorrow!`,
          html,
        });

        if (!result.success) {
          const errMsg = `Email failed for ${customerEmail}: ${result.error}`;
          console.error(`[Reminders Cron] ${errMsg}`);
          errors.push(errMsg);
          failed++;
          continue;
        }

        console.log(`[Reminders Cron] Reminder email sent to ${customerEmail} (Booking: ${booking.booking_id})`);
      }

      // 2. Also send an in-app notification (if user has an account)
      if (booking.user_id) {
        await sendNotification({
          userId: booking.user_id,
          type: "reminder",
          title: "Upcoming Appointment Tomorrow!",
          message: `Don't forget! Your ${serviceName} is scheduled for ${tomorrowStr} at ${bookingTime}. Please arrive 5-10 minutes early.`,
          data: {
            bookingId: booking.id,
            serviceName,
            date: tomorrowStr,
            time: bookingTime,
          },
          actionUrl: `/dashboard`,
        });
      }

      sent++;
    } catch (err) {
      const errMsg = `Unexpected error for booking ${booking.booking_id}: ${String(err)}`;
      console.error(`[Reminders Cron] ${errMsg}`);
      errors.push(errMsg);
      failed++;
    }
  }

  console.log(`[Reminders Cron] Done. Sent: ${sent}, Failed: ${failed}`);

  return NextResponse.json({
    success: true,
    date: tomorrowStr,
    total: bookings.length,
    sent,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  });
}
