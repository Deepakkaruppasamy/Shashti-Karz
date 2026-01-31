import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const priority = searchParams.get("priority");

        let query = supabase
            .from("support_requests")
            .select("*")
            .order("created_at", { ascending: false });

        if (status) {
            query = query.eq("status", status);
        }

        if (priority) {
            query = query.eq("priority", priority);
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
            customer_phone,
            category,
            subject,
            message,
            priority = "medium",
        } = body;

        // Validate required fields
        if (!customer_name || !category || !subject || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get user if authenticated
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from("support_requests")
            .insert({
                user_id: user?.id || null,
                customer_name,
                customer_email: customer_email || user?.email || null,
                customer_phone,
                category,
                subject,
                message,
                priority,
                status: "pending",
                conversation_history: [
                    {
                        sender: "customer",
                        message,
                        timestamp: new Date().toISOString(),
                    },
                ],
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
