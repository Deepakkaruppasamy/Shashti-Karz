import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    // 0. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const { data: rpcData, error: rpcError } = await supabase.rpc('calculate_vehicle_health_score', {
        p_vehicle_id: id
    });

    if (rpcError) {
        console.error("RPC Health Score Error:", rpcError);
        // If RPC fails but we have a score, just return it
        if (existingScore) {
            return NextResponse.json(existingScore);
        }
        return NextResponse.json({
            error: rpcError.message,
            code: rpcError.code
        }, { status: 500 });
    }

    const scoreData = rpcData?.[0];

    if (scoreData) {
        // 3. Verify Vehicle Ownership before allowing any system-level updates
        const { data: vehicleOwnership } = await supabase
            .from("user_vehicles")
            .select("id")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();

        if (!vehicleOwnership) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const healthScoreRecord = {
            vehicle_id: id,
            overall_score: scoreData.overall_score || 0,
            exterior_score: scoreData.exterior_score || 0,
            interior_score: scoreData.interior_score || Math.max(0, (scoreData.overall_score || 70) - (Math.random() * 10)),
            coating_health_score: scoreData.exterior_score || Math.max(0, (scoreData.overall_score || 60) - (Math.random() * 15)),
            paint_protection_score: scoreData.exterior_score || Math.max(0, (scoreData.overall_score || 65) - (Math.random() * 5)),
            maintenance_compliance_score: scoreData.maintenance_compliance || 0,
            total_services: scoreData.total_services || 0,
            total_spent: scoreData.total_spent || 0,
            calculation_method: 'service_history_enhanced',
            calculated_at: new Date().toISOString(),
        };

        const adminSupabase = await createServiceClient();

        if (existingScore) {
            await adminSupabase
                .from("vehicle_health_scores")
                .update(healthScoreRecord)
                .eq("vehicle_id", id);
        } else {
            await adminSupabase
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
