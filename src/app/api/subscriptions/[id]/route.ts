import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PUT /api/subscriptions/[id] - Update subscription
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { action } = body; // 'pause', 'resume', 'cancel', 'update_payment'

        // Get subscription
        const { data: subscription, error: fetchError } = await supabase
            .from("user_subscriptions")
            .select("*")
            .eq("id", params.id)
            .eq("user_id", user.id)
            .single();

        if (fetchError || !subscription) {
            return NextResponse.json(
                { error: "Subscription not found" },
                { status: 404 }
            );
        }

        let updateData: any = {};

        switch (action) {
            case "pause":
                updateData = { status: "paused" };
                break;
            case "resume":
                updateData = { status: "active" };
                break;
            case "cancel":
                updateData = {
                    status: "cancelled",
                    cancelled_at: new Date().toISOString(),
                    cancellation_reason: body.reason,
                    auto_renew: false,
                };
                break;
            case "update_payment":
                updateData = { payment_method_id: body.payment_method_id };
                break;
            case "toggle_auto_renew":
                updateData = { auto_renew: !subscription.auto_renew };
                break;
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("user_subscriptions")
            .update({ ...updateData, updated_at: new Date().toISOString() })
            .eq("id", params.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ subscription: data });
    } catch (error) {
        console.error("Error updating subscription:", error);
        return NextResponse.json(
            { error: "Failed to update subscription" },
            { status: 500 }
        );
    }
}

// GET /api/subscriptions/[id] - Get subscription details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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
        plan:subscription_plans(*),
        usage:subscription_usage(*)
      `)
            .eq("id", params.id)
            .eq("user_id", user.id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ subscription: data });
    } catch (error) {
        console.error("Error fetching subscription:", error);
        return NextResponse.json(
            { error: "Failed to fetch subscription" },
            { status: 500 }
        );
    }
}
