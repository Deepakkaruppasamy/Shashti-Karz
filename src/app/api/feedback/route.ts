import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const feedbackType = searchParams.get("type");

        let query = supabase
            .from("customer_feedback_dinesh")
            .select("*")
            .order("created_at", { ascending: false });

        if (status) {
            query = query.eq("status", status);
        }

        if (feedbackType) {
            query = query.eq("feedback_type", feedbackType);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ data }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const {
            customer_name,
            customer_email,
            feedback_type,
            category,
            rating,
            message,
            satisfaction_score,
            would_recommend = true,
        } = body;

        // Validate required fields
        if (!customer_name || !feedback_type || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get user if authenticated
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from("customer_feedback_dinesh")
            .insert({
                user_id: user?.id || null,
                customer_name,
                customer_email: customer_email || user?.email || null,
                feedback_type,
                category,
                rating,
                message,
                satisfaction_score,
                would_recommend,
                status: "new",
                tags: [],
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
