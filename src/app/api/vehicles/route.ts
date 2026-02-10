import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const fleetId = searchParams.get("fleet_id");

  let query = supabase
    .from("user_vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (fleetId) {
    query = query.eq("fleet_id", fleetId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Authentication error:", authError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Ensure user_id is set to authenticated user
    const vehicleData = {
      ...body,
      user_id: user.id
    };

    console.log("Attempting to insert vehicle:", vehicleData);

    const { data, error } = await supabase
      .from("user_vehicles")
      .insert(vehicleData)
      .select()
      .single();

    if (error) {
      console.error("Database error inserting vehicle:", error);
      return NextResponse.json({
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json({
      error: "Internal server error",
      message: error.message
    }, { status: 500 });
  }
}
