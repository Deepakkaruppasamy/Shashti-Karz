import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: fleet, error: fleetError } = await supabase
    .from("fleet_accounts")
    .select("*")
    .eq("id", id)
    .single();

  if (fleetError) {
    return NextResponse.json({ error: fleetError.message }, { status: 500 });
  }

  const { data: vehicles, error: vehiclesError } = await supabase
    .from("user_vehicles")
    .select("*")
    .eq("fleet_id", id);

  if (vehiclesError) {
    return NextResponse.json({ error: vehiclesError.message }, { status: 500 });
  }

  return NextResponse.json({
    ...fleet,
    vehicles: vehicles || [],
    vehicle_count: vehicles?.length || 0,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("fleet_accounts")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("fleet_accounts")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
