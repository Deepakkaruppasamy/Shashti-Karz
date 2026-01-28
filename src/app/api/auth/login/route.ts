import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendAuthNotification } from "@/lib/auth-notifications";

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
    await sendAuthNotification({
      type: "login",
      email: data.user.email!,
      name: profile?.full_name || "Customer",
      time: new Date().toLocaleString(),
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
