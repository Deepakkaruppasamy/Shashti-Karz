import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";


export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const adminSession = cookieStore.get("admin_session");

        if (!adminSession) {
            return NextResponse.json({ error: "Unauthorized - Admin login required" }, { status: 401 });
        }

        const supabase = await createClient();

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const since = searchParams.get("since");

        let interactionsQuery = supabase
            .from("dinesh_interactions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (since) {
            interactionsQuery = interactionsQuery.gt("created_at", since);
        }

        const { data: interactions, error: interactionsError } = await interactionsQuery;

        if (interactionsError) throw interactionsError;

        let supportQuery = supabase
            .from("support_requests")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (since) {
            supportQuery = supportQuery.gt("created_at", since);
        }

        const { data: supportRequests, error: supportError } = await supportQuery;

        if (supportError) throw supportError;

        let feedbackQuery = supabase
            .from("customer_feedback_dinesh")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (since) {
            feedbackQuery = feedbackQuery.gt("created_at", since);
        }

        const { data: feedback, error: feedbackError } = await feedbackQuery;

        if (feedbackError) throw feedbackError;

        const events = [
            ...(interactions || []).map(item => ({
                id: item.id,
                type: "interaction" as const,
                timestamp: new Date(item.created_at),
                user_name: item.metadata?.userName || "Guest",
                query: item.user_query,
                category: item.interaction_type,
                intent: item.intent_detected,
                confidence: item.confidence_score
            })),
            ...(supportRequests || []).map(item => ({
                id: item.id,
                type: "support_request" as const,
                timestamp: new Date(item.created_at),
                user_name: item.customer_name,
                subject: item.subject,
                category: item.category,
                priority: item.priority,
                status: item.status
            })),
            ...(feedback || []).map(item => ({
                id: item.id,
                type: "feedback" as const,
                timestamp: new Date(item.created_at),
                user_name: item.customer_name,
                feedbackType: item.feedback_type,
                rating: item.rating,
                category: item.category,
                message: item.message?.substring(0, 100) + (item.message?.length > 100 ? "..." : "")
            }))
        ];

        events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        const stats = {
            totalInteractions: interactions?.length || 0,
            totalSupportRequests: supportRequests?.length || 0,
            totalFeedback: feedback?.length || 0,
            urgentRequests: supportRequests?.filter(r => r.priority === "urgent").length || 0,
            highPriorityRequests: supportRequests?.filter(r => r.priority === "high").length || 0,
            pendingRequests: supportRequests?.filter(r => r.status === "pending").length || 0,
            newFeedback: feedback?.filter(f => f.status === "new").length || 0
        };

        const queryWords = interactions
            ?.flatMap(i => i.user_query?.toLowerCase().split(" ") || [])
            .filter(word => word.length > 3)
            .reduce((acc: Record<string, number>, word) => {
                acc[word] = (acc[word] || 0) + 1;
                return acc;
            }, {});

        const wordCloud = Object.entries(queryWords || {})
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 20)
            .map(([word, count]) => ({ word, count }));

        return NextResponse.json({
            success: true,
            events: events.slice(0, limit),
            stats,
            wordCloud,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Admin pulse error:", error);
        return NextResponse.json(
            { error: "Failed to fetch pulse data" },
            { status: 500 }
        );
    }
}
