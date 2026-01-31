import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { id } = params;
        const body = await request.json();

        const {
            status,
            priority,
            admin_response,
            conversation_message,
        } = body;

        // Get current user (must be admin)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get current support request
        const { data: currentRequest } = await supabase
            .from("support_requests")
            .select("*")
            .eq("id", id)
            .single();

        if (!currentRequest) {
            return NextResponse.json(
                { error: "Support request not found" },
                { status: 404 }
            );
        }

        // Build update object
        const updates: any = {};

        if (status) updates.status = status;
        if (priority) updates.priority = priority;
        if (admin_response) {
            updates.admin_response = admin_response;
            updates.admin_responder_id = user.id;
            updates.responded_at = new Date().toISOString();
        }

        // Add conversation message if provided
        if (conversation_message) {
            const newHistory = [
                ...(currentRequest.conversation_history || []),
                {
                    sender: "admin",
                    message: conversation_message,
                    timestamp: new Date().toISOString(),
                },
            ];
            updates.conversation_history = newHistory;
        }

        const { data, error } = await supabase
            .from("support_requests")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
