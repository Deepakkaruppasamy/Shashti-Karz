import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vehicle, error: vehicleError } = await supabase
    .from("user_vehicles")
    .select("*")
    .eq("id", id)
    .single();

  if (vehicleError) {
    return NextResponse.json({ error: vehicleError.message }, { status: 500 });
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("*, service:services(*)")
    .or(`car_model.ilike.%${vehicle.name}%,car_model.ilike.%${vehicle.number_plate || 'xxx'}%`)
    .eq("user_id", vehicle.user_id)
    .order("date", { ascending: false });

  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 500 });
  }

  return NextResponse.json({
    vehicle,
    service_history: bookings || [],
    total_services: bookings?.length || 0,
    total_spent: bookings?.reduce((sum, b) => sum + (b.price || 0), 0) || 0,
  });
}
