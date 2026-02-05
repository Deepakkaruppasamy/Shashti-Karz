import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();
    const { fleet_id, vehicle_ids, service_id, date, time, notes } = await request.json();

    if (!fleet_id || !vehicle_ids || !service_id || !date || !time) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
        // 1. Get fleet and owner details
        const { data: fleet, error: fleetError } = await supabase
            .from("fleet_accounts")
            .select("*, profiles!owner_id(*)")
            .eq("id", fleet_id)
            .single();

        if (fleetError) throw fleetError;

        // 2. Get vehicles
        const { data: vehicles, error: vehiclesError } = await supabase
            .from("user_vehicles")
            .select("*")
            .in("id", vehicle_ids);

        if (vehiclesError) throw vehiclesError;

        // 3. Create individual bookings for each vehicle
        const bookings = vehicles.map(vehicle => ({
            fleet_id,
            user_id: fleet.owner_id,
            service_id,
            car_type: vehicle.car_type || "sedan",
            car_model: `${vehicle.brand} ${vehicle.model}`,
            date,
            time,
            customer_name: fleet.company_name,
            customer_email: (fleet as any).profiles?.email || "",
            customer_phone: fleet.contact_phone || "",
            notes: `Fleet Booking: ${notes || ""}`,
            status: "pending",
            payment_status: "pending",
            booking_id: `FLT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        }));

        const { data, error: insertError } = await supabase
            .from("bookings")
            .insert(bookings)
            .select();

        if (insertError) throw insertError;

        // 4. Update the vehicles' next service date if applicable
        // (Optional: can be handled by a DB trigger on booking completion)

        return NextResponse.json({ success: true, count: data.length, bookings: data });
    } catch (error: any) {
        console.error("Bulk booking error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
