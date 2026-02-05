import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const adminSession = cookieStore.get("admin_session");

        if (!adminSession) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createClient();

        // 1. Fetch all bookings for historical data
        const { data: bookings, error: bookingsError } = await supabase
            .from("bookings")
            .select("*, services(name, price)")
            .order("date", { ascending: true });

        if (bookingsError) throw bookingsError;

        // 2. Fetch fleet data
        const { data: fleets, error: fleetsError } = await supabase
            .from("fleet_accounts")
            .select("*");

        if (fleetsError) throw fleetsError;

        // 3. Fetch reviews
        const { data: reviews, error: reviewsError } = await supabase
            .from("reviews")
            .select("rating, sentiment_score");

        if (reviewsError) throw reviewsError;

        // 4. Process Revenue Trends (Last 6 Months)
        const monthlyRevenue: Record<string, number> = {};
        const fleetRevenue: Record<string, number> = { corporate: 0, individual: 0 };
        const servicePerformance: Record<string, { count: number; revenue: number }> = {};

        bookings.forEach(booking => {
            const date = new Date(booking.date);
            const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });

            // Monthly revenue
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (booking.price || 0);

            // Corporate vs Individual
            if (booking.fleet_id) {
                fleetRevenue.corporate += (booking.price || 0);
            } else {
                fleetRevenue.individual += (booking.price || 0);
            }

            // Service Performance
            const serviceName = (booking as any).services?.name || "Unknown";
            if (!servicePerformance[serviceName]) {
                servicePerformance[serviceName] = { count: 0, revenue: 0 };
            }
            servicePerformance[serviceName].count++;
            servicePerformance[serviceName].revenue += (booking.price || 0);
        });

        // 5. Calculate Efficiency (Mocked for now, but could use service_tracking)
        const efficiency = {
            avgServiceTime: "2.4 hours",
            onTimeRate: "94%",
            resourceUtilization: "82%"
        };

        // 6. Customer Satisfaction
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 5;

        return NextResponse.json({
            revenueTrends: Object.entries(monthlyRevenue).map(([name, value]) => ({ name, value })),
            fleetMix: [
                { name: "Corporate Fleet", value: fleetRevenue.corporate },
                { name: "Retail Individual", value: fleetRevenue.individual }
            ],
            servicePerformance: Object.entries(servicePerformance)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.revenue - a.revenue),
            stats: {
                totalRevenue: bookings.reduce((sum, b) => sum + (b.price || 0), 0),
                totalBookings: bookings.length,
                totalFleets: fleets.length,
                avgRating: avgRating.toFixed(1)
            },
            efficiency
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
