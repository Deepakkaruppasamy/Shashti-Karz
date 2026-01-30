import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// GET /api/workers/performance - Get worker performance
export async function GET(request: NextRequest) {
    try {
        const isAdminSession = request.cookies.get("admin_session");
        const supabase = isAdminSession ? await createServiceClient() : await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user && !isAdminSession) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const workerId = searchParams.get("worker_id");

        if (workerId) {
            // Get specific worker performance
            const { data, error } = await supabase
                .from("worker_performance")
                .select(`
          *,
          bonuses:worker_bonuses(*)
        `)
                .eq("worker_id", workerId)
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ performance: data });
        }

        // Check role if not an admin session
        if (!isAdminSession && user) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profile?.role !== "admin" && profile?.role !== "manager") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const { data, error } = await supabase
            .from("worker_performance")
            .select(`
        *,
        worker:profiles(id, full_name, avatar_url)
      `)
            .order("total_revenue", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ performances: data });
    } catch (error) {
        console.error("Error fetching performance:", error);
        return NextResponse.json(
            { error: "Failed to fetch performance" },
            { status: 500 }
        );
    }
}
