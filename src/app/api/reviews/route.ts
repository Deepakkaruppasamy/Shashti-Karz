import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { analyzeReviewSentiment } from "@/lib/ai-rating";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const isAdmin = searchParams.get("admin") === "true";
  const serviceId = searchParams.get("serviceId");

  let query = supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query = query.eq("approved", true);
  }
  
  if (serviceId) {
    query = query.eq("service_id", serviceId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  // Perform AI Sentiment Analysis
  const sentiment = await analyzeReviewSentiment(body.comment);

  // Check for repeat customer
  let isRepeatCustomer = false;
  if (body.user_id) {
    const { count } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", body.user_id);
    isRepeatCustomer = (count || 0) > 0;
  }

    const reviewData = {
      ...body,
      sentiment_score: sentiment.score,
      sentiment_label: sentiment.label,
      ai_metadata: {
        themes: sentiment.themes,
        intensity: sentiment.intensity,
        is_low_effort: sentiment.is_low_effort
      },
      is_repeat_customer: isRepeatCustomer,
      is_verified: true,
      abuse_score: sentiment.is_abusive ? 1.0 : 0.0,
      flagged: sentiment.is_abusive,
      approved: !sentiment.is_abusive && !body.is_private, // Don't auto-approve private feedback for home page
      feedback_category: body.feedback_category || 'service',
      is_private: body.is_private || false
    };

  const { data, error } = await supabase
    .from("reviews")
    .insert(reviewData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
