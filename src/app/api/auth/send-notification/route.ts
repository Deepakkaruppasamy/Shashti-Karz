import { NextResponse } from "next/server";
import { sendAuthNotification } from "@/lib/auth-notifications";

export async function POST(req: Request) {
  try {
    const { type, email, name, time, ip } = await req.json();

    const result = await sendAuthNotification({
      type,
      email,
      name,
      time,
      ip
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error sending auth notification email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

