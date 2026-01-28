import { NextResponse } from "next/server";
import { sendEmail, generateWelcomeEmail, generateLoginNotificationEmail } from "@/lib/email-service";

export async function POST(req: Request) {
  try {
    const { type, email, name, time, ip } = await req.json();

    let result = { success: true, error: undefined as string | undefined };

      if (type === "signup") {
        const html = generateWelcomeEmail({ customerName: name });
        const emailRes = await sendEmail({
          to: email,
          subject: "Welcome to Shashti Karz!",
          html,
        });
        if (!emailRes.success) {
          console.warn(`Signup email failed for ${email}: ${emailRes.error}`);
          result = { success: false, error: emailRes.error };
        }
      } else if (type === "login") {
        const html = generateLoginNotificationEmail({ 
          customerName: name, 
          time: time || new Date().toLocaleString(),
          ip 
        });
        const emailRes = await sendEmail({
          to: email,
          subject: "New Login Detected - Shashti Karz",
          html,
        });
        if (!emailRes.success) {
          console.warn(`Login email failed for ${email}: ${emailRes.error}`);
          result = { success: false, error: emailRes.error };
        }
      }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error sending auth notification email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
