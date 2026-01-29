import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/customers/ltv - Get customer lifetime value data
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get("user_id");
        const segment = searchParams.get("segment");

        if (userId) {
            // Get specific user LTV
            const { data, error } = await supabase
                .from("customer_lifetime_value")
                .select("*")
                .eq("user_id", userId)
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ ltv: data });
        }

        // Get all customers (admin only)
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin" && profile?.role !== "manager") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        let query = supabase
            .from("customer_lifetime_value")
            .select(`
        *,
        user:profiles(id, full_name, email, phone)
      `)
            .order("total_spent", { ascending: false });

        if (segment) {
            query = query.eq("customer_segment", segment);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get segment summary
        const { data: segments } = await supabase
            .from("customer_segments")
            .select("*");

        return NextResponse.json({ customers: data, segments });
    } catch (error) {
        console.error("Error fetching LTV:", error);
        return NextResponse.json(
            { error: "Failed to fetch LTV data" },
            { status: 500 }
        );
    }
}
