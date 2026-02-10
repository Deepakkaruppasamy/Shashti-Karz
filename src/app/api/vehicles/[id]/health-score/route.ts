import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('calculate_vehicle_health_score', {
        p_vehicle_id: id
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get or create health score record
    const scoreData = data?.[0];

    if (scoreData) {
        const { data: existingScore } = await supabase
            .from("vehicle_health_scores")
            .select("*")
            .eq("vehicle_id", id)
            .single();

        const healthScoreRecord = {
            vehicle_id: id,
            overall_score: scoreData.overall_score || 0,
            exterior_score: scoreData.exterior_score || 0,
            interior_score: scoreData.interior_score || 0,
            coating_health_score: scoreData.exterior_score || 0,
            paint_protection_score: scoreData.exterior_score || 0,
            maintenance_compliance_score: scoreData.maintenance_compliance || 0,
            total_services: scoreData.total_services || 0,
            total_spent: scoreData.total_spent || 0,
            calculated_at: new Date().toISOString(),
        };

        if (existingScore) {
            await supabase
                .from("vehicle_health_scores")
                .update(healthScoreRecord)
                .eq("vehicle_id", id);
        } else {
            await supabase
                .from("vehicle_health_scores")
                .insert(healthScoreRecord);
        }

        return NextResponse.json(healthScoreRecord);
    }

    return NextResponse.json({
        vehicle_id: id,
        overall_score: 0,
        message: "No service history found"
    });
}
