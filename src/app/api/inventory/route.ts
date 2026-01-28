import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const lowStock = searchParams.get("low_stock");

  let query = supabase
    .from("inventory_items")
    .select("*")
    .order("name", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let filteredData = data || [];
  if (lowStock === "true") {
    filteredData = filteredData.filter(
      (item) => item.current_stock <= item.min_stock_threshold
    );
  }

  return NextResponse.json(filteredData);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  if (body.action === "restock") {
    const { item_id, quantity } = body;
    
    const { data: item, error: fetchError } = await supabase
      .from("inventory_items")
      .select("current_stock")
      .eq("id", item_id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("inventory_items")
      .update({
        current_stock: (item?.current_stock || 0) + quantity,
        last_restocked_at: new Date().toISOString(),
      })
      .eq("id", item_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from("inventory_items")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
