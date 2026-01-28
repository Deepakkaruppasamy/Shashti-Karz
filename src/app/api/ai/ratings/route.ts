import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { calculateWeightedRating, RatingInput } from "@/lib/ai-rating";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
    }

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("approved", true);

    if (error) {
      return NextResponse.json({
        finalRating: 0,
        confidence: "Low",
        totalReviews: 0,
        indicators: []
      });
    }

    const serviceReviews = reviews?.filter(r => 
      r.service_id === serviceId || r.service?.toLowerCase().includes(serviceId.replace(/-/g, ' '))
    ) || [];

    if (serviceReviews.length === 0) {
      return NextResponse.json({
        finalRating: 0,
        confidence: "Low",
        totalReviews: 0,
        indicators: []
      });
    }

    const now = new Date();
    const inputs: RatingInput[] = serviceReviews.map((r) => ({
      stars: r.rating,
      sentiment: {
        score: r.sentiment_score || 0,
        label: (r.sentiment_label as any) || "Neutral",
        themes: r.ai_metadata?.themes || [],
        intensity: r.ai_metadata?.intensity || 0.5,
        is_abusive: r.flagged || false,
        is_low_effort: r.ai_metadata?.is_low_effort || false,
      },
      is_repeat_customer: r.is_repeat_customer || false,
      is_verified: r.is_verified !== false,
      days_ago: Math.floor((now.getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24))
    }));

    const result = calculateWeightedRating(inputs);

    const indicators: string[] = [];
    const recentReviews = inputs.filter(i => i.days_ago < 30);
    const olderReviews = inputs.filter(i => i.days_ago >= 30 && i.days_ago < 90);
    
    if (recentReviews.length > 0) {
      const recentAvg = recentReviews.reduce((acc, curr) => acc + curr.stars, 0) / recentReviews.length;
      const olderAvg = olderReviews.length > 0 
        ? olderReviews.reduce((acc, curr) => acc + curr.stars, 0) / olderReviews.length
        : recentAvg;

      if (recentAvg > olderAvg + 0.3) indicators.push("Recently improved");
      if (Math.abs(recentAvg - olderAvg) < 0.2 && inputs.length > 20) indicators.push("Highly consistent");
    }

    return NextResponse.json({
      ...result,
      indicators
    });
  } catch (err) {
    console.error("AI Rating error:", err);
    return NextResponse.json({
      finalRating: 0,
      confidence: "Low",
      totalReviews: 0,
      indicators: []
    });
  }
}
