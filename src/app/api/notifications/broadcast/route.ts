import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, generatePromotionalEmail } from "@/lib/email-service";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("broadcast_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching history:", error);
      return NextResponse.json({ history: [] });
    }

    return NextResponse.json({ history: data || [] });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ history: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, channels, priority, targetAudience, offerCode, discount } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    let query = supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("role", "customer");

    const { data: users, error: usersError } = await query;

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    const targetUsers = users || [];
    let sentCount = 0;
    let emailsSent = 0;
    const errors: string[] = [];

    for (const user of targetUsers) {
      if (channels.includes("in_app")) {
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: user.id,
            type: "promotion",
            category: "promotion",
            title,
            message,
            data: { offerCode, discount },
            channels,
            priority,
            read: false,
            delivered_channels: ["in_app"],
          });

        if (notifError) {
          console.error(`Failed to insert notification for user ${user.id}:`, notifError);
          errors.push(`in_app for ${user.email}: ${notifError.message}`);
        } else {
          sentCount++;
        }
      }

      if (channels.includes("email") && user.email) {
        try {
          const html = generatePromotionalEmail({
            customerName: user.full_name || "Valued Customer",
            title,
            message,
            offerCode: offerCode || undefined,
            discount: discount || undefined,
          });

          const result = await sendEmail({
            to: user.email,
            subject: title,
            html,
          });

          if (result.success) {
            emailsSent++;
          } else {
            errors.push(`email to ${user.email}: ${result.error}`);
          }
        } catch (emailError) {
          console.error(`Email error for ${user.email}:`, emailError);
          errors.push(`email to ${user.email}: ${String(emailError)}`);
        }
      }
    }

    await supabase.from("broadcast_history").insert({
      title,
      message,
      channels,
      priority,
      target_audience: targetAudience,
      offer_code: offerCode || null,
      discount: discount || null,
      sent_count: sentCount,
      emails_sent: emailsSent,
      total_users: targetUsers.length,
      status: errors.length === 0 ? "success" : "partial",
    }).then(() => {}).catch(() => {});

    return NextResponse.json({
      success: true,
      sentCount,
      emailsSent,
      totalUsers: targetUsers.length,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    });
  } catch (error) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ error: "Failed to send broadcast: " + String(error) }, { status: 500 });
  }
}
