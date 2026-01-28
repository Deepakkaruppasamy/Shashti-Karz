import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all");
  
  let query = supabase
    .from("services")
    .select("*")
    .order("created_at", { ascending: true });

  if (!all) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

    return NextResponse.json(data || []);
  }
  
  export async function POST(request: Request) {
    const supabase = await createClient();
    const body = await request.json();
  
    const { data, error } = await supabase
      .from("services")
      .insert(body)
      .select()
      .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
