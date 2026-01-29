import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/achievements - Get user achievements
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all achievements
        const { data: allAchievements, error: achievementsError } = await supabase
            .from("achievements")
            .select("*")
            .eq("active", true)
            .order("points", { ascending: false });

        if (achievementsError) {
            return NextResponse.json({ error: achievementsError.message }, { status: 500 });
        }

        // Get user's unlocked achievements
        const { data: userAchievements, error: userError } = await supabase
            .from("user_achievements")
            .select("*, achievement:achievements(*)")
            .eq("user_id", user.id);

        if (userError) {
            return NextResponse.json({ error: userError.message }, { status: 500 });
        }

        // Get user points
        const { data: points, error: pointsError } = await supabase
            .from("user_points")
            .select("*")
            .eq("user_id", user.id)
            .single();

        return NextResponse.json({
            all_achievements: allAchievements,
            unlocked: userAchievements,
            points: points || { total_points: 0, current_level: 1 },
        });
    } catch (error) {
        console.error("Error fetching achievements:", error);
        return NextResponse.json(
            { error: "Failed to fetch achievements" },
            { status: 500 }
        );
    }
}
