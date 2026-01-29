import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const lowStock = searchParams.get("low_stock");

  let query = supabase
    .from("inventory")
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
      (item) => item.quantity <= item.min_quantity
    );
  }

  // Map to match frontend expectations
  const mappedData = filteredData.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description,
    current_stock: item.quantity,
    min_stock_threshold: item.min_quantity,
    max_stock_threshold: item.max_quantity,
    unit: item.unit,
    cost_per_unit: item.price_per_unit,
    supplier: item.supplier,
    last_restocked_at: item.last_restocked,
    location: item.location,
    sku: item.sku,
    status: item.status,
    created_at: item.created_at,
    updated_at: item.updated_at
  }));

  return NextResponse.json(mappedData);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  // Handle restock action
  if (body.action === "restock") {
    const { item_id, quantity } = body;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Create transaction record
    const { error: transactionError } = await supabase
      .from("inventory_transactions")
      .insert({
        inventory_id: item_id,
        type: "restock",
        quantity: quantity,
        notes: "Manual restock via admin panel",
        performed_by: user?.id
      });

    if (transactionError) {
      return NextResponse.json({ error: transactionError.message }, { status: 500 });
    }

    // The trigger will automatically update the inventory quantity
    // Fetch the updated item
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("id", item_id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  // Handle new item creation
  const inventoryData = {
    name: body.name,
    category: body.category,
    description: body.description || null,
    quantity: body.current_stock || 0,
    min_quantity: body.min_stock_threshold || 10,
    max_quantity: body.max_stock_threshold || 100,
    unit: body.unit || "units",
    price_per_unit: body.cost_per_unit || 0,
    supplier: body.supplier || null,
    location: body.location || null,
    sku: body.sku || null,
    status: "active"
  };

  const { data, error } = await supabase
    .from("inventory")
    .insert(inventoryData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
