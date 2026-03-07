
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Try RPC first (cleanest way)
        const { error: rpcError } = await supabase.rpc('check_achievements', {
            user_id_param: user.id
        });

        if (!rpcError) {
            await supabase.rpc('update_customer_leaderboard');
            return NextResponse.json({ success: true, method: 'rpc' });
        }

        console.warn("RPC check_achievements failed, falling back to JS implementation:", rpcError.message);

        // 2. JS Fallback Implementation
        // Get user stats
        const { data: bookings } = await supabase
            .from("bookings")
            .select("price")
            .eq("user_id", user.id)
            .eq("status", "completed");

        const stats = {
            booking_count: bookings?.length || 0,
            total_spent: bookings?.reduce((sum, b) => sum + (Number(b.price) || 0), 0) || 0,
            // Add other stats as needed (referrals, reviews etc.)
        };

        // Get all achievements
        const { data: achievements } = await supabase
            .from("achievements")
            .select("*")
            .eq("active", true);

        // Get already unlocked
        const { data: unlocked } = await supabase
            .from("user_achievements")
            .select("achievement_id")
            .eq("user_id", user.id);

        const unlockedIds = new Set(unlocked?.map(u => u.achievement_id));
        const newUnlocks = [];

        if (achievements) {
            for (const ach of achievements) {
                if (unlockedIds.has(ach.id)) continue;

                let met = true;
                const criteria = ach.unlock_criteria || {};

                if (criteria.booking_count && stats.booking_count < criteria.booking_count) met = false;
                if (criteria.total_spent && stats.total_spent < criteria.total_spent) met = false;

                if (met) {
                    newUnlocks.push(ach);
                }
            }
        }

        // Apply new unlocks
        for (const ach of newUnlocks) {
            await supabase.from("user_achievements").insert({
                user_id: user.id,
                achievement_id: ach.id
            });

            // Add points transaction
            await supabase.from("points_transactions").insert({
                user_id: user.id,
                points: ach.points,
                transaction_type: 'earned',
                source: 'achievement',
                source_id: ach.id,
                description: `Unlocked: ${ach.name}`
            });

            // Update user points
            const { data: currentPoints } = await supabase
                .from("user_points")
                .select("total_points, lifetime_points")
                .eq("user_id", user.id)
                .single();

            const total = (currentPoints?.total_points || 0) + ach.points;
            const lifetime = (currentPoints?.lifetime_points || 0) + ach.points;

            await supabase.from("user_points").upsert({
                user_id: user.id,
                total_points: total,
                lifetime_points: lifetime,
                updated_at: new Date().toISOString()
            });
        }

        return NextResponse.json({
            success: true,
            method: 'js_fallback',
            unlocked_count: newUnlocks.length
        });
    } catch (error) {
        console.error("Sync error:", error);
        return NextResponse.json(
            { error: "Failed to sync achievements" },
            { status: 500 }
        );
    }
}
