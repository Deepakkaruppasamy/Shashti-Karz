import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Verify Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error("Auth error in diagnostic save:", authError);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { vehicle_id, overall_score, recommendations, detections, diagnostic_image } = body;

        if (!vehicle_id) {
            return NextResponse.json({ error: "Vehicle ID is required" }, { status: 400 });
        }

        // 2. Verify Vehicle Ownership
        const { data: vehicle, error: vehicleError } = await supabase
            .from("user_vehicles")
            .select("id")
            .eq("id", vehicle_id)
            .eq("user_id", user.id)
            .single();

        if (vehicleError || !vehicle) {
            console.error("Ownership verification failed:", vehicleError);
            return NextResponse.json({ error: "Vehicle not found or access denied" }, { status: 403 });
        }

        // 3. Use Service Client to bypass RLS for UPSERT
        // This ensures the health score is saved even if the user's RLS policy for vehicle_health_scores is too restrictive
        const adminSupabase = await createServiceClient();

        // Check if a health score already exists for this vehicle
        const { data: existingScore } = await adminSupabase
            .from("vehicle_health_scores")
            .select("id")
            .eq("vehicle_id", vehicle_id)
            .single();

        let result;
        if (existingScore) {
            result = await adminSupabase
                .from("vehicle_health_scores")
                .update({
                    overall_score,
                    exterior_score: overall_score,
                    recommendations,
                    detections,
                    diagnostic_image,
                    calculation_method: 'ai_vision_v2.4',
                    calculated_at: new Date().toISOString()
                })
                .eq("id", existingScore.id)
                .select()
                .single();
        } else {
            result = await adminSupabase
                .from("vehicle_health_scores")
                .insert({
                    vehicle_id,
                    overall_score,
                    exterior_score: overall_score,
                    recommendations,
                    detections,
                    diagnostic_image,
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

        // 4. Generate a Digital Health Certificate for the AI Analysis
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 3); // AI scans valid for 3 months

        await adminSupabase.from("service_certificates").insert({
            vehicle_id,
            user_id: user.id,
            service_name: "Shashti Vision AI Health Scan",
            service_type: "ai_diagnostic",
            certificate_type: "quality_guarantee",
            warranty_start_date: new Date().toISOString().split('T')[0],
            warranty_end_date: expiryDate.toISOString().split('T')[0],
            warranty_period_months: 3,
            warranty_terms: "Verified AI visual analysis of paint and surface integrity. Recommendation for remedial services valid for 90 days from scan date.",
            status: "active",
            pdf_url: `https://shashtikarz.com/verify/ai-cert/${Math.random().toString(36).substring(7).toUpperCase()}`,
            certificate_number: `SK-AI-${Math.random().toString(36).substring(7).toUpperCase()}`
        });

        return NextResponse.json({ success: true, data: result.data });
    } catch (error) {
        console.error("Error saving diagnostic results:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
