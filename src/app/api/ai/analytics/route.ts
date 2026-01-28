import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { 
  generateAIInsights, 
  processNaturalLanguageQuery, 
  detectAnomalies, 
  detectRiskPatterns, 
  generateSmartDiscounts 
} from "@/lib/shashti-ai";
import { chatWithGemini } from "@/lib/gemini";

async function getAnalyticsData(timeRange: string) {
  const supabase = await createClient();
  const now = new Date();
  let startDate = new Date();
  let previousStartDate = new Date();
  let previousEndDate = new Date();

  if (timeRange === "today") {
    startDate.setHours(0, 0, 0, 0);
    previousStartDate.setDate(startDate.getDate() - 1);
    previousStartDate.setHours(0, 0, 0, 0);
    previousEndDate.setHours(0, 0, 0, 0);
  } else if (timeRange === "week") {
    startDate.setDate(now.getDate() - 7);
    previousStartDate.setDate(startDate.getDate() - 7);
    previousEndDate = new Date(startDate);
  } else if (timeRange === "month") {
    startDate.setMonth(now.getMonth() - 1);
    previousStartDate.setMonth(startDate.getMonth() - 1);
    previousEndDate = new Date(startDate);
  } else if (timeRange === "quarter") {
    startDate.setMonth(now.getMonth() - 3);
    previousStartDate.setMonth(startDate.getMonth() - 3);
    previousEndDate = new Date(startDate);
  } else {
    startDate.setFullYear(now.getFullYear() - 1);
    previousStartDate.setFullYear(startDate.getFullYear() - 1);
    previousEndDate = new Date(startDate);
  }

  const { data: currentBookings } = await supabase
    .from("bookings")
    .select("*, service:services(*), worker:workers(*)")
    .gte("created_at", startDate.toISOString());

  const { data: previousBookings } = await supabase
    .from("bookings")
    .select("*, service:services(*), worker:workers(*)")
    .gte("created_at", previousStartDate.toISOString())
    .lt("created_at", previousEndDate.toISOString());

    const { data: allServices } = await supabase.from("services").select("*");
    const { data: allUsers } = await supabase.from("profiles").select("*");
    const { data: allWorkers } = await supabase.from("workers").select("*");
    const { data: allInventory } = await supabase.from("inventory_items").select("*");
    const lowStockItems = (allInventory || []).filter(item => item.current_stock < item.min_stock_threshold);


    const { data: activeAlerts } = await supabase
      .from("system_alerts")
      .select("*")
      .eq("resolved", false)
      .order("created_at", { ascending: false });

    const bookings = currentBookings || [];
    const prevBookings = previousBookings || [];

    const totalRevenue = bookings
      .filter((b) => b.status === "completed" || b.payment_status === "paid")
      .reduce((sum, b) => sum + (b.price || 0), 0);

    const prevRevenue = prevBookings
      .filter((b) => b.status === "completed" || b.payment_status === "paid")
      .reduce((sum, b) => sum + (b.price || 0), 0);

    const revenueChange = prevRevenue > 0 
      ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) 
      : 0;

    // Advanced Revenue Forecast (using growth rate and seasonal weight)
    const daysInPeriod = timeRange === "today" ? 1 : timeRange === "week" ? 7 : timeRange === "month" ? 30 : 90;
    const dailyAvg = totalRevenue / daysInPeriod;
    const growthFactor = 1 + (revenueChange / 100);
    // Add 10% safety margin and weight recent trends more
    const revenueForecast = Math.round(dailyAvg * 7 * Math.max(0.8, Math.min(1.5, growthFactor)));

    // Service Duration Analytics
    const { data: trackingData } = await supabase
      .from("service_tracking")
      .select("*")
      .eq("status", "completed");
    
    let avgServiceDuration = 0;
    if (trackingData && trackingData.length > 0) {
      const durations = trackingData
        .filter(t => t.started_at && t.completed_at)
        .map(t => new Date(t.completed_at).getTime() - new Date(t.started_at).getTime());
      if (durations.length > 0) {
        avgServiceDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / (1000 * 60)); // in minutes
      }
    }


  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;
  const inProgressBookings = bookings.filter((b) => b.status === "approved" || b.status === "in_progress").length;
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled").length;

  const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;
  const cancellationRate = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;

  const avgOrderValue = completedBookings > 0 ? Math.round(totalRevenue / completedBookings) : 0;

  const servicePopularity: Record<string, { name: string; count: number; revenue: number }> = {};
  bookings.forEach((b) => {
    const serviceName = b.service?.name || "Unknown";
    if (!servicePopularity[serviceName]) {
      servicePopularity[serviceName] = { name: serviceName, count: 0, revenue: 0 };
    }
    servicePopularity[serviceName].count++;
    if (b.status === "completed") {
      servicePopularity[serviceName].revenue += b.price || 0;
    }
  });

  const sortedServices = Object.values(servicePopularity).sort((a, b) => b.count - a.count);
  const topService = sortedServices[0] || null;
  const lowPerformingService = sortedServices[sortedServices.length - 1] || null;

  const dayCount: Record<string, number> = {};
  bookings.forEach((b) => {
    const day = new Date(b.date).toLocaleDateString("en-US", { weekday: "long" });
    dayCount[day] = (dayCount[day] || 0) + 1;
  });
  const peakDay = Object.entries(dayCount)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || "Saturday";

  const hourCount: Record<number, number> = {};
  bookings.forEach((b) => {
    const hour = parseInt(b.time?.split(":")[0] || "10");
    hourCount[hour] = (hourCount[hour] || 0) + 1;
  });
  const peakHour = Object.entries(hourCount)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || "10";
  const peakHours = `${peakHour}:00 - ${parseInt(peakHour) + 2}:00`;

  const revenueByDay: Record<string, number> = {};
  const bookingsByDay: Record<string, number> = {};
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    revenueByDay[dateStr] = 0;
    bookingsByDay[dateStr] = 0;
  }

  bookings.forEach((b) => {
    const dateStr = new Date(b.created_at).toISOString().split("T")[0];
    if (revenueByDay[dateStr] !== undefined) {
      bookingsByDay[dateStr]++;
      if (b.status === "completed") {
        revenueByDay[dateStr] += b.price || 0;
      }
    }
  });

  const newCustomers = (allUsers || []).filter(
    (u) => new Date(u.created_at) >= startDate
  ).length;

  const workerPerformance: Record<string, { name: string; bookings: number; revenue: number }> = {};
  bookings.forEach((b) => {
    if (b.assigned_worker_id) {
      const workerName = b.worker?.name || "Unknown";
      if (!workerPerformance[b.assigned_worker_id]) {
        workerPerformance[b.assigned_worker_id] = { name: workerName, bookings: 0, revenue: 0 };
      }
      workerPerformance[b.assigned_worker_id].bookings++;
      if (b.status === "completed" || b.payment_status === "paid") {
        workerPerformance[b.assigned_worker_id].revenue += b.price || 0;
      }
    }
  });

  const funnel = {
    pending: pendingBookings,
    approved: bookings.filter(b => b.status === "approved").length,
    in_progress: inProgressBookings,
    completed: completedBookings,
    cancelled: cancelledBookings,
  };

    return {
      totalRevenue,
      prevRevenue,
      revenueChange,
      revenueForecast,
      lowStockItems: lowStockItems || [],
      activeAlerts: activeAlerts || [],
      totalBookings,
      completedBookings,

    pendingBookings,
    inProgressBookings,
    cancelledBookings,
    completionRate,
    cancellationRate,
    avgOrderValue,
    topService,
    lowPerformingService,
    servicePopularity: sortedServices,
      workerPerformance: Object.values(workerPerformance).sort((a, b) => b.revenue - a.revenue),
      funnel,
      peakDay,
      peakHours,
      avgServiceDuration,
      revenueByDay: Object.entries(revenueByDay).map(([date, value]) => ({ date, value })),

    bookingsByDay: Object.entries(bookingsByDay).map(([date, value]) => ({ date, value })),
    newCustomers,
    totalCustomers: (allUsers || []).length,
    currentBookings: bookings,
    previousBookings: prevBookings
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get("timeRange") || "month";
    const includeInsights = searchParams.get("insights") === "true";
    const includeAnomalies = searchParams.get("anomalies") === "true";

    const analyticsData = await getAnalyticsData(timeRange);

    let insights: any[] = [];
    let anomalies: any[] = [];

    if (includeInsights) {
      const baseInsights = generateAIInsights(analyticsData);
      const discountRecommendations = generateSmartDiscounts(analyticsData);
      insights = [...baseInsights, ...discountRecommendations];
    }

    if (includeAnomalies) {
      const baseAnomalies = detectAnomalies(
        analyticsData.currentBookings,
        analyticsData.previousBookings
      );
      const riskPatterns = detectRiskPatterns(analyticsData.currentBookings);
      anomalies = [...baseAnomalies, ...riskPatterns];
    }

    const { currentBookings, previousBookings, ...safeAnalytics } = analyticsData;

    return NextResponse.json({
      ...safeAnalytics,
      insights,
      anomalies,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, timeRange = "month" } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const analyticsData = await getAnalyticsData(timeRange);

    if (process.env.GEMINI_API_KEY) {
      const systemPrompt = `You are Shashti AI, the analytics assistant for Shashti Karz car detailing business. 
Analyze the following data and answer the user's question in a helpful, actionable way.

ANALYTICS DATA:
${JSON.stringify(analyticsData, null, 2)}

GUIDELINES:
- Be specific with numbers and percentages
- Provide actionable recommendations
- Use markdown formatting
- Be concise but thorough
- If asked about trends, compare with previous period
- Always suggest next steps`;

      const answer = await chatWithGemini([{ role: "user", content: query }], systemPrompt);

      return NextResponse.json({
        answer: answer || "Unable to process query",
        analyticsSnapshot: {
          totalRevenue: analyticsData.totalRevenue,
          totalBookings: analyticsData.totalBookings,
          completionRate: analyticsData.completionRate
        }
      });
    }

    const answer = await processNaturalLanguageQuery(query, analyticsData);
    return NextResponse.json({
      answer,
      analyticsSnapshot: {
        totalRevenue: analyticsData.totalRevenue,
        totalBookings: analyticsData.totalBookings,
        completionRate: analyticsData.completionRate
      }
    });

  } catch (error) {
    console.error("Analytics query error:", error);
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 });
  }
}
