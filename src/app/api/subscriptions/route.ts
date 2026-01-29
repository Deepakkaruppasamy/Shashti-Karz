import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/subscriptions - Create new subscription
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { plan_id, payment_method_id } = body;

        if (!plan_id) {
            return NextResponse.json(
                { error: "plan_id is required" },
                { status: 400 }
            );
        }

        // Get plan details
        const { data: plan, error: planError } = await supabase
            .from("subscription_plans")
            .select("*")
            .eq("id", plan_id)
            .eq("active", true)
            .single();

        if (planError || !plan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        // Check if user already has an active subscription
        const { data: existing } = await supabase
            .from("user_subscriptions")
            .select("id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .single();

        if (existing) {
            return NextResponse.json(
                { error: "User already has an active subscription" },
                { status: 400 }
            );
        }

        // Calculate period end
        const now = new Date();
        let periodEnd = new Date(now);

        switch (plan.billing_cycle) {
            case "monthly":
                periodEnd.setMonth(periodEnd.getMonth() + 1);
                break;
            case "quarterly":
                periodEnd.setMonth(periodEnd.getMonth() + 3);
                break;
            case "annual":
                periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                break;
        }

        // Create subscription
        const { data: subscription, error: subError } = await supabase
            .from("user_subscriptions")
            .insert({
                user_id: user.id,
                plan_id,
                status: "active",
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                next_billing_date: periodEnd.toISOString(),
                payment_method_id,
            })
            .select()
            .single();

        if (subError) {
            return NextResponse.json({ error: subError.message }, { status: 500 });
        }

        // Create first invoice
        await supabase.from("subscription_invoices").insert({
            subscription_id: subscription.id,
            user_id: user.id,
            amount: plan.price,
            status: "pending",
            billing_period_start: now.toISOString(),
            billing_period_end: periodEnd.toISOString(),
        });

        return NextResponse.json({ subscription }, { status: 201 });
    } catch (error) {
        console.error("Error creating subscription:", error);
        return NextResponse.json(
            { error: "Failed to create subscription" },
            { status: 500 }
        );
    }
}

// GET /api/subscriptions - Get user's subscriptions
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("user_subscriptions")
            .select(`
        *,
        plan:subscription_plans(*)
      `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ subscriptions: data });
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        return NextResponse.json(
            { error: "Failed to fetch subscriptions" },
            { status: 500 }
        );
    }
}
