import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("vehicle_id");
    const certificateNumber = searchParams.get("certificate_number");

    let query = supabase
        .from("service_certificates")
        .select(`
      *,
      vehicle:user_vehicles(*)
    `)
        .order("created_at", { ascending: false });

    if (vehicleId) {
        query = query.eq("vehicle_id", vehicleId);
    }

    if (certificateNumber) {
        query = query.eq("certificate_number", certificateNumber);
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

    // Generate certificate number if not provided
    if (!body.certificate_number) {
        const { data: certNumberData } = await supabase.rpc('generate_certificate_number');
        body.certificate_number = certNumberData;
    }

    // Generate verification hash
    if (!body.verification_hash) {
        body.verification_hash = crypto.randomUUID();
    }

    const { data, error } = await supabase
        .from("service_certificates")
        .insert(body)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
