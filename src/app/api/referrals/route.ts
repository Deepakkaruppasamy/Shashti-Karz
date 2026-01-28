import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function generateReferralCode(userId: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "SK";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const referrerId = searchParams.get("referrer_id");
  const code = searchParams.get("code");

  let query = supabase
    .from("referrals")
    .select("*")
    .order("created_at", { ascending: false });

  if (referrerId) {
    query = query.eq("referrer_id", referrerId);
  }

  if (code) {
    query = query.eq("code", code);
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

  if (body.action === "generate") {
    const code = generateReferralCode(body.user_id);
    
    const { data, error } = await supabase
      .from("referrals")
      .insert({
        referrer_id: body.user_id,
        code,
        status: "pending",
        reward_amount: 500,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  if (body.action === "apply") {
    const { data: referral, error: findError } = await supabase
      .from("referrals")
      .select("*")
      .eq("code", body.code)
      .eq("status", "pending")
      .is("referred_id", null)
      .single();

    if (findError || !referral) {
      return NextResponse.json({ error: "Invalid or already used referral code" }, { status: 400 });
    }

    if (referral.referrer_id === body.referred_id) {
      return NextResponse.json({ error: "Cannot use your own referral code" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("referrals")
      .update({
        referred_id: body.referred_id,
        status: "completed",
      })
      .eq("id", referral.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from("referrals")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
