import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { vehicle_id, overall_score, recommendations, detections } = body;

        if (!vehicle_id) {
            return NextResponse.json({ error: "Vehicle ID is required" }, { status: 400 });
        }

        // Check if a health score already exists for this vehicle
        const { data: existingScore } = await supabase
            .from("vehicle_health_scores")
            .select("id")
            .eq("vehicle_id", vehicle_id)
            .single();

        let result;
        if (existingScore) {
            result = await supabase
                .from("vehicle_health_scores")
                .update({
                    overall_score,
                    exterior_score: overall_score,
                    recommendations,
                    calculation_method: 'ai_vision_v2.4',
                    calculated_at: new Date().toISOString()
                })
                .eq("id", existingScore.id)
                .select()
                .single();
        } else {
            result = await supabase
                .from("vehicle_health_scores")
                .insert({
                    vehicle_id,
                    overall_score,
                    exterior_score: overall_score,
                    recommendations,
                    calculation_method: 'ai_vision_v2.4',
                    calculated_at: new Date().toISOString()
                })
                .select()
                .single();
        }

        if (result.error) {
            console.error("Supabase Error [Diagnostic Save]:", result.error);
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (error) {
        console.error("Error saving diagnostic results:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
