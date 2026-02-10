import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("vehicle_id");
    const userId = searchParams.get("user_id");
    const status = searchParams.get("status");

    let query = supabase
        .from("vehicle_maintenance_reminders")
        .select("*")
        .order("due_date", { ascending: true });

    if (vehicleId) {
        query = query.eq("vehicle_id", vehicleId);
    }

    if (userId) {
        query = query.eq("user_id", userId);
    }

    if (status) {
        query = query.eq("status", status);
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

    const { data, error } = await supabase
        .from("vehicle_maintenance_reminders")
        .insert(body)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
