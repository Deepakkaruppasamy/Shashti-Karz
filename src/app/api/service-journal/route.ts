import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("vehicle_id");
    const userId = searchParams.get("user_id");

    let query = supabase
        .from("service_journal_entries")
        .select(`
      *,
      worker:workers(*)
    `)
        .order("service_date", { ascending: false });

    if (vehicleId) {
        query = query.eq("vehicle_id", vehicleId);
    }

    if (userId) {
        query = query.eq("user_id", userId);
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
        .from("service_journal_entries")
        .insert(body)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
