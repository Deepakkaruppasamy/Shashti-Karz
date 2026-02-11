import { createClient, createServiceClient } from "@/lib/supabase/server";
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

    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // 2. Verify Vehicle Ownership
    if (body.vehicle_id) {
        const { data: vehicle } = await supabase
            .from("user_vehicles")
            .select("id")
            .eq("id", body.vehicle_id)
            .eq("user_id", user.id)
            .single();

        if (!vehicle) {
            return NextResponse.json({ error: "Vehicle not found or access denied" }, { status: 403 });
        }
    }

    const adminSupabase = await createServiceClient();

    // Generate certificate number if not provided
    if (!body.certificate_number) {
        const { data: certNumberData } = await adminSupabase.rpc('generate_certificate_number');
        body.certificate_number = certNumberData || `SK-AI-${Math.random().toString(36).substring(7).toUpperCase()}`;
    }

    // Generate verification hash
    if (!body.verification_hash) {
        body.verification_hash = crypto.randomUUID();
    }

    // Ensure user_id is set
    if (!body.user_id) {
        body.user_id = user.id;
    }

    const { data, error } = await adminSupabase
        .from("service_certificates")
        .insert(body)
        .select()
        .single();

    if (error) {
        console.error("Certificate generation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
