import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { email, password, name } = await request.json();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        full_name: name,
        role: "customer",
      });

      // Trigger welcome notification
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await fetch(`${appUrl}/api/auth/send-notification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "signup",
            email: data.user.email,
            name: name || "Customer",
          }),
        });
      } catch (notifError) {
        console.error("Failed to send welcome notification:", notifError);
      }
    }

  return NextResponse.json({ user: data.user, session: data.session });
}
