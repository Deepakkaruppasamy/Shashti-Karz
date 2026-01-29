import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/feedback/nps - Submit NPS survey
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { booking_id, score, feedback_text } = body;

        // Determine category
        let category = "passive";
        if (score >= 9) category = "promoter";
        else if (score <= 6) category = "detractor";

        const { data, error } = await supabase
            .from("nps_surveys")
            .insert({
                user_id: user.id,
                booking_id,
                score,
                feedback_text,
                category,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ survey: data });
    } catch (error) {
        console.error("Error submitting NPS:", error);
        return NextResponse.json(
            { error: "Failed to submit NPS" },
            { status: 500 }
        );
    }
}

// GET /api/feedback/nps - Get NPS data
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Calculate NPS score
        const { data, error } = await supabase
            .from("nps_surveys")
            .select("score, category");

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const total = data.length;
        const promoters = data.filter((s) => s.category === "promoter").length;
        const detractors = data.filter((s) => s.category === "detractor").length;
        const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;

        return NextResponse.json({
            nps_score: npsScore,
            total_responses: total,
            promoters,
            detractors,
            passives: total - promoters - detractors,
        });
    } catch (error) {
        console.error("Error fetching NPS:", error);
        return NextResponse.json(
            { error: "Failed to fetch NPS" },
            { status: 500 }
        );
    }
}
