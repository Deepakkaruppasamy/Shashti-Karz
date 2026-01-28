import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { email, password } = await request.json();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  // Trigger login notification
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await fetch(`${appUrl}/api/auth/send-notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "login",
        email: data.user.email,
        name: profile?.full_name || "Customer",
        time: new Date().toLocaleString(),
      }),
    });
  } catch (notifError) {
    console.error("Failed to send login notification:", notifError);
  }

  return NextResponse.json({
    user: data.user,
    session: data.session,
    profile,
  });
}
