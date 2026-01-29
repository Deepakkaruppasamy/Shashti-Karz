import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/routes/optimize - Optimize worker route
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { worker_id, date } = body;

        // Call optimization function
        const { data, error } = await supabase.rpc("optimize_worker_route", {
            worker_id_param: worker_id,
            route_date_param: date,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ route: data });
    } catch (error) {
        console.error("Error optimizing route:", error);
        return NextResponse.json(
            { error: "Failed to optimize route" },
            { status: 500 }
        );
    }
}

// GET /api/routes/optimize - Get optimized route
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const workerId = searchParams.get("worker_id");
        const date = searchParams.get("date");

        const { data, error } = await supabase
            .from("worker_routes")
            .select(`
        *,
        stops:route_stops(
          *,
          booking:bookings(*)
        )
      `)
            .eq("worker_id", workerId)
            .eq("route_date", date)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ route: data });
    } catch (error) {
        console.error("Error fetching route:", error);
        return NextResponse.json(
            { error: "Failed to fetch route" },
            { status: 500 }
        );
    }
}
