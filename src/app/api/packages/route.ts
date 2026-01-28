import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const active = searchParams.get("active");

  let query = supabase
    .from("service_packages")
    .select("*")
    .order("price", { ascending: true });

  if (active === "true") {
    query = query.eq("active", true);
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

  if (body.action === "calculate_bundle") {
    const { service_ids } = body;
    
    const { data: services, error } = await supabase
      .from("services")
      .select("*")
      .in("id", service_ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const totalPrice = services?.reduce((sum, s) => sum + (s.price || 0), 0) || 0;
    const bundleDiscount = service_ids.length >= 3 ? 0.15 : service_ids.length >= 2 ? 0.10 : 0;
    const bundlePrice = Math.round(totalPrice * (1 - bundleDiscount));

    return NextResponse.json({
      services,
      total_price: totalPrice,
      bundle_discount: bundleDiscount * 100,
      bundle_price: bundlePrice,
      savings: totalPrice - bundlePrice,
    });
  }

  const { data, error } = await supabase
    .from("service_packages")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
