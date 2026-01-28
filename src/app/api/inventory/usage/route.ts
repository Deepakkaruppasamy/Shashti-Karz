import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("booking_id");
  const itemId = searchParams.get("item_id");

  let query = supabase
    .from("service_inventory_usage")
    .select("*, item:inventory_items(*)")
    .order("created_at", { ascending: false });

  if (bookingId) {
    query = query.eq("booking_id", bookingId);
  }

  if (itemId) {
    query = query.eq("item_id", itemId);
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

  const { data: item, error: itemError } = await supabase
    .from("inventory_items")
    .select("current_stock, cost_per_unit")
    .eq("id", body.item_id)
    .single();

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 });
  }

  if ((item?.current_stock || 0) < body.quantity_used) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("inventory_items")
    .update({ current_stock: (item?.current_stock || 0) - body.quantity_used })
    .eq("id", body.item_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("service_inventory_usage")
    .insert({
      ...body,
      cost_at_time: item?.cost_per_unit || 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
