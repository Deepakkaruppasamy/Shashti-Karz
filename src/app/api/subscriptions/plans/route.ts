import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/subscriptions/plans - Get all subscription plans
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;
        const billingCycle = searchParams.get("billing_cycle");

        let query = supabase
            .from("subscription_plans")
            .select("*")
            .eq("active", true)
            .order("price", { ascending: true });

        if (billingCycle) {
            query = query.eq("billing_cycle", billingCycle);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ plans: data });
    } catch (error) {
        console.error("Error fetching plans:", error);
        return NextResponse.json(
            { error: "Failed to fetch plans" },
            { status: 500 }
        );
    }
}
