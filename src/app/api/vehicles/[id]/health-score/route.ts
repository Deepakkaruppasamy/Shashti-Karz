import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. First, check if there's an existing health score calculated recently (especially if it was by AI)
    const { data: existingScore } = await supabase
        .from("vehicle_health_scores")
        .select("*")
        .eq("vehicle_id", id)
        .single();

    // If there is an AI diagnostic result from the last 24 hours, use it
    if (existingScore && existingScore.calculation_method?.includes('ai_vision')) {
        const lastCalc = new Date(existingScore.calculated_at);
        const now = new Date();
        const diffHours = (now.getTime() - lastCalc.getTime()) / (1000 * 60 * 60);

        if (diffHours < 24) {
            return NextResponse.json(existingScore);
        }
    }

    // 2. Fallback to RPC calculation (based on service history)
    console.log(`DEBUG: Calling RPC calculate_vehicle_health_score for vehicle ${id}`);
    const { data: rpcData, error: rpcError } = await supabase.rpc('calculate_vehicle_health_score', {
        p_vehicle_id: id
    });

    if (rpcError) {
        console.error("DEBUG: RPC Health Score Error:", rpcError);
        // If RPC fails but we have a score, just return it
        if (existingScore) {
            console.log("DEBUG: Using existing score as fallback");
            return NextResponse.json(existingScore);
        }
        return NextResponse.json({
            error: rpcError.message,
            details: rpcError.details,
            hint: rpcError.hint,
            code: rpcError.code
        }, { status: 500 });
    }

    const scoreData = rpcData?.[0];

    if (scoreData) {
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
            calculation_method: 'service_history',
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
        message: "No health data found"
    });
}
