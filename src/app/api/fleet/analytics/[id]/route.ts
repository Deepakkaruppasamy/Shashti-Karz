import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: fleetId } = await params;
    const supabase = await createClient();

    try {
        // 1. Get fleet data
        const { data: fleet, error: fleetError } = await supabase
            .from("fleet_accounts")
            .select("*")
            .eq("id", fleetId)
            .single();

        if (fleetError) throw fleetError;

        // 2. Get vehicles in this fleet
        const { data: vehicles, error: vehiclesError } = await supabase
            .from("user_vehicles")
            .select("*")
            .eq("fleet_id", fleetId);

        if (vehiclesError) throw vehiclesError;

        // 3. Get bookings for this fleet
        const { data: bookings, error: bookingsError } = await supabase
            .from("bookings")
            .select("*")
            .eq("fleet_id", fleetId)
            .order("date", { ascending: false });

        if (bookingsError) throw bookingsError;

        // 4. Calculate Analytics
        const totalVehicles = vehicles?.length || 0;
        const totalBookings = bookings?.length || 0;
        const completedBookings = bookings?.filter(b => b.status === "completed").length || 0;
        const totalSpent = bookings?.filter(b => b.status === "completed").reduce((sum, b) => sum + (b.price || 0), 0) || 0;

        // Fleet Health - Average of vehicle health scores if available (mocked for now)
        const fleetHealth = 88;

        // Monthly Breakdown
        const monthlyStats = bookings?.reduce((acc: any, b) => {
            const month = new Date(b.date).toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + (b.price || 0);
            return acc;
        }, {});

        return NextResponse.json({
            fleet,
            totalVehicles,
            totalBookings,
            completedBookings,
            totalSpent,
            fleetHealth,
            monthlyStats,
            recentBookings: bookings?.slice(0, 5) || [],
            vehicles: vehicles || []
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
