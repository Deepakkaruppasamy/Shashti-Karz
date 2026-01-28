import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const date = searchParams.get("date");
  const limit = searchParams.get("limit");

  let query = supabase
    .from("bookings")
    .select("*, service:services(*), worker:workers(*)")
    .in("status", ["approved", "pending"])
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (status) {
    query = supabase
      .from("bookings")
      .select("*, service:services(*), worker:workers(*)")
      .eq("status", status)
      .order("date", { ascending: true })
      .order("time", { ascending: true });
  }

  if (date) {
    query = query.eq("date", date);
  }

  if (limit) {
    query = query.limit(parseInt(limit));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const queue = (data || []).map((booking, index) => ({
    ...booking,
    queue_position: index + 1,
    estimated_wait_time: `${index * 30} mins`,
  }));

  return NextResponse.json(queue);
}
