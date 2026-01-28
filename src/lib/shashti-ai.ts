export type UserRole = "guest" | "customer" | "admin" | "super_admin";

export interface AIContext {
  userRole: UserRole;
  userId?: string;
  userName?: string;
  sessionHistory: AIMessage[];
  currentPage?: string;
  recentBookings?: any[];
  loyaltyData?: any;
  analyticsData?: any;
}

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  intent?: string;
  entities?: Record<string, any>;
}

export interface AIIntent {
  name: string;
  confidence: number;
  entities: Record<string, any>;
}

export interface AIInsight {
  type: "revenue" | "booking" | "customer" | "service" | "alert" | "recommendation";
  title: string;
  description: string;
  value?: string | number;
  trend?: "up" | "down" | "stable";
  priority: "low" | "medium" | "high" | "critical";
  action?: string;
  actionUrl?: string;
}

const BUSINESS_KNOWLEDGE = {
  name: "Shashti Karz",
  tagline: "Car Detailing Xpert",
  location: "Avinashi Road, Tirupur, Tamil Nadu 641652",
  phone: "+91 98765 43210",
  whatsapp: "919876543210",
  email: "info@shashtikarz.com",
  experience: "3+ years",
  carsDetailed: "500+",
  rating: "5.0",
    certifications: ["IDA Certified", "Gtechniq Accredited"],
    products: ["Gtechniq (UK)", "Gyeon (Korea)", "CarPro (Korea)", "Koch Chemie (Germany)"],
    workers: [
      { role: "Lead Detailer", skills: ["Ceramic Coating", "Paint Correction", "PPF"] },
      { role: "Interior Specialist", skills: ["Deep Cleaning", "Leather Restoration", "Odor Removal"] },
      { role: "Wash Technician", skills: ["Steam Wash", "Undercarriage Cleaning", "Engine Detailing"] }
    ],
    warranties: {

    ceramicCoating: "5-year protection",
    ppf: "10-year warranty",
    general: "30-day satisfaction guarantee"
  },
  hours: {
    weekdays: "9:00 AM - 7:00 PM",
    saturday: "9:00 AM - 6:00 PM",
    sunday: "10:00 AM - 4:00 PM"
  }
};

const INTENT_PATTERNS: Record<string, RegExp[]> = {
  booking: [/book/i, /appointment/i, /schedule/i, /reserve/i, /slot/i],
  pricing: [/price/i, /cost/i, /rate/i, /charge/i, /fee/i, /how much/i],
  services: [/service/i, /detailing/i, /ceramic/i, /ppf/i, /polish/i, /wash/i, /coating/i],
  offers: [/offer/i, /discount/i, /deal/i, /promo/i, /coupon/i, /code/i],
  tracking: [/track/i, /status/i, /where.*car/i, /progress/i, /stage/i],
  loyalty: [/points/i, /reward/i, /loyalty/i, /tier/i, /referral/i],
  hours: [/hour/i, /open/i, /close/i, /timing/i, /when.*open/i],
  location: [/location/i, /address/i, /where/i, /direction/i, /map/i],
  contact: [/contact/i, /phone/i, /call/i, /whatsapp/i, /email/i],
  analytics: [/revenue/i, /sales/i, /report/i, /analytics/i, /performance/i, /trend/i]
};

export function classifyIntent(message: string): AIIntent {
  const intents: { name: string; score: number }[] = [];
  
  for (const [intentName, patterns] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        score += 1;
      }
    }
    if (score > 0) {
      intents.push({ name: intentName, score });
    }
  }
  
  intents.sort((a, b) => b.score - a.score);
  
  const topIntent = intents[0] || { name: "general", score: 0 };
  const confidence = Math.min(topIntent.score / 3, 1);
  
  return {
    name: topIntent.name,
    confidence,
    entities: {}
  };
}

export function buildSystemPrompt(
  role: UserRole,
  services: any[],
  offers: any[],
  carTypes: any[],
  context?: Partial<AIContext>
): string {
  const basePrompt = `You are Shashti AI, the intelligent assistant for ${BUSINESS_KNOWLEDGE.name} - ${BUSINESS_KNOWLEDGE.tagline}. You are NOT a generic chatbot - you are specifically trained on this business's services, policies, and operations.

## LANGUAGE PREFERENCE
- Current Language: ${context?.language || 'en'}
- IMPORTANT: You MUST respond in ${context?.language === 'hi' ? 'Hindi' : context?.language === 'ta' ? 'Tamil' : 'English'}.
- Use local terminology where appropriate for Tirupur/Tamil Nadu context.

## YOUR IDENTITY
- Name: Shashti AI
- Role: AI-powered business assistant
- Personality: Professional, knowledgeable, helpful, and automotive-passionate
- Tone: Warm but expert, like a trusted car specialist friend

## BUSINESS KNOWLEDGE
${JSON.stringify(BUSINESS_KNOWLEDGE, null, 2)}

## CURRENT SERVICES
${services.map(s => `- **${s.name}** (₹${s.price} base): ${s.short_desc}. Duration: ${s.duration}. Rating: ${s.rating}/5. ${s.popular ? "POPULAR" : ""} ${s.premium ? "PREMIUM" : ""}`).join("\n")}

## CAR TYPE MULTIPLIERS
${carTypes.map(c => `- ${c.name}: ${c.price_multiplier}x`).join("\n")}

## ACTIVE OFFERS
${offers.map(o => `- **${o.title}**: ${o.discount} - Code: ${o.code} (Valid: ${o.valid_till})`).join("\n")}
`;

  let roleSpecificPrompt = "";
  
  switch (role) {
    case "admin":
      roleSpecificPrompt = `
## YOUR ROLE: ADMIN OPERATIONS ASSISTANT
You're helping an admin manage the business.

## CAPABILITIES
- Analyze business performance
- Explain analytics in plain language
- Suggest operational improvements
- Monitor booking pipeline
- Detect anomalies or issues`;
      break;
      
    case "customer":
      roleSpecificPrompt = `
## YOUR ROLE: CUSTOMER ASSISTANT
You're helping a logged-in customer: ${context?.userName || "Valued Customer"}

## CAPABILITIES
- Access their booking history
- Track current service status
- Manage loyalty points
- Personalized recommendations
- Book new appointments`;
      break;
      
    default:
      roleSpecificPrompt = `
## YOUR ROLE: GUEST ASSISTANT
You're helping a potential customer who hasn't logged in yet.
- Focus on service information and pricing
- Encourage them to create an account for benefits
- Guide them to book or contact us
- Highlight current offers`;
  }

  return basePrompt + roleSpecificPrompt + `

## RESPONSE GUIDELINES
1. Be conversational but professional
2. Use markdown formatting for clarity
3. Always be accurate with prices
4. Proactively suggest next steps
5. Keep responses concise but complete
6. Format prices as ₹X,XXX`;
}

export function generateAIInsights(analyticsData: any): AIInsight[] {
  const insights: AIInsight[] = [];
  
  if (analyticsData.revenueChange !== undefined) {
    const trend = analyticsData.revenueChange > 0 ? "up" : analyticsData.revenueChange < 0 ? "down" : "stable";
    insights.push({
      type: "revenue",
      title: trend === "up" ? "Revenue Growing!" : trend === "down" ? "Revenue Needs Attention" : "Revenue Stable",
      description: `Revenue ${trend === "up" ? "increased" : trend === "down" ? "decreased" : "remained stable"} by ${Math.abs(analyticsData.revenueChange)}% compared to last period.`,
      value: `₹${analyticsData.totalRevenue?.toLocaleString() || 0}`,
      trend,
      priority: trend === "down" ? "high" : "medium"
    });
  }

  // Inventory Health Insights
  if (analyticsData.lowStockItems && analyticsData.lowStockItems.length > 0) {
    insights.push({
      type: "alert",
      title: "Inventory Stock Warning",
      description: `${analyticsData.lowStockItems.length} items are below minimum threshold. High risk of service interruption.`,
      value: analyticsData.lowStockItems.length,
      priority: "critical",
      action: "Restock Inventory",
      actionUrl: "/admin?tab=inventory"
    });
  }

  // Forecast Insight
  if (analyticsData.revenueForecast) {
    insights.push({
      type: "revenue",
      title: "Revenue Forecast",
      description: `Based on booking trends, next week's estimated revenue is ₹${analyticsData.revenueForecast.toLocaleString()}.`,
      value: `₹${analyticsData.revenueForecast.toLocaleString()}`,
      trend: "stable",
      priority: "medium"
    });
  }
  
  if (analyticsData.pendingBookings > 5) {
    insights.push({
      type: "alert",
      title: "High Pending Bookings",
      description: `${analyticsData.pendingBookings} bookings are pending approval.`,
      value: analyticsData.pendingBookings,
      priority: analyticsData.pendingBookings > 10 ? "critical" : "high",
      action: "Review pending bookings",
      actionUrl: "/admin?tab=bookings"
    });
  }
  
  if (analyticsData.topService) {
    insights.push({
      type: "service",
      title: "Top Performing Service",
      description: `${analyticsData.topService.name} is your most booked service with ${analyticsData.topService.count} bookings.`,
      value: analyticsData.topService.name,
      trend: "up",
      priority: "low"
    });
  }
  
  return insights;
}

export function detectAnomalies(bookings: any[], previousBookings: any[]): AIInsight[] {
  const anomalies: AIInsight[] = [];
  
  const currentCount = bookings.length;
  const previousCount = previousBookings.length;
  const changePercent = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0;
  
  if (changePercent < -30) {
    anomalies.push({
      type: "alert",
      title: "Significant Booking Drop Detected",
      description: `Bookings dropped by ${Math.abs(Math.round(changePercent))}% compared to the previous period.`,
      value: `${Math.round(changePercent)}%`,
      trend: "down",
      priority: "critical",
      action: "Investigate and take action"
    });
  }
  
  const cancellations = bookings.filter(b => b.status === "cancelled").length;
  const cancellationRate = currentCount > 0 ? (cancellations / currentCount) * 100 : 0;
  
  if (cancellationRate > 15) {
    anomalies.push({
      type: "alert",
      title: "High Cancellation Rate",
      description: `${Math.round(cancellationRate)}% of bookings were cancelled.`,
      value: `${Math.round(cancellationRate)}%`,
      trend: "down",
      priority: "high",
      action: "Review cancellation reasons"
    });
  }
  
  return anomalies;
}

export function detectRiskPatterns(bookings: any[]): AIInsight[] {
  const risks: AIInsight[] = [];
  
  // 1. Repeated Cancellations
  const customerCancellations: Record<string, number> = {};
  bookings.filter(b => b.status === "cancelled").forEach(b => {
    customerCancellations[b.customer_email] = (customerCancellations[b.customer_email] || 0) + 1;
  });
  
  const repeatCancellers = Object.entries(customerCancellations).filter(([, count]) => count >= 2);
  if (repeatCancellers.length > 0) {
    risks.push({
      type: "alert",
      title: "Repeated Cancellations Detected",
      description: `${repeatCancellers.length} customers have cancelled 2 or more times recently.`,
      priority: "high",
      action: "Review customer accounts"
    });
  }
  
  // 2. Payment Failures
  const paymentFailures = bookings.filter(b => b.payment_status === "failed").length;
  if (paymentFailures > 3) {
    risks.push({
      type: "alert",
      title: "Payment Failure Spike",
      description: `${paymentFailures} payment failures detected in this period.`,
      priority: "critical",
      action: "Check Stripe Logs"
    });
  }
  
  // 3. Drop-offs (Pending for more than 24h)
  const now = new Date();
  const dropOffs = bookings.filter(b => 
    b.status === "pending" && 
    (now.getTime() - new Date(b.created_at).getTime()) > (24 * 60 * 60 * 1000)
  ).length;
  
  if (dropOffs > 5) {
    risks.push({
      type: "alert",
      title: "Booking Drop-offs",
      description: `${dropOffs} bookings have been pending for more than 24 hours.`,
      priority: "medium",
      action: "Contact Customers"
    });
  }
  
  return risks;
}

export function generateSmartDiscounts(analyticsData: any): AIInsight[] {
  const recommendations: AIInsight[] = [];
  
  // 1. Loyalty-based discounts
  if (analyticsData.returningCustomers > 0) {
    recommendations.push({
      type: "recommendation",
      title: "Loyalty Boost",
      description: "Send a 15% discount to your returning customers to increase lifetime value.",
      priority: "medium",
      action: "Send Promo"
    });
  }
  
  // 2. Low-performing service discount
  if (analyticsData.lowPerformingService) {
    recommendations.push({
      type: "recommendation",
      title: `Promote ${analyticsData.lowPerformingService.name}`,
      description: `This service has the lowest bookings. Offer a limited-time 20% discount.`,
      priority: "high",
      action: "Launch Offer"
    });
  }
  
  // 3. Peak hour optimization
  if (analyticsData.slowestDay) {
    recommendations.push({
      type: "recommendation",
      title: "Slow Day Special",
      description: `Tuesdays are your slowest days. Offer a 'Happy Tuesday' 10% discount.`,
      priority: "low",
      action: "Create Rule"
    });
  }
  
  return recommendations;
}

export async function processNaturalLanguageQuery(query: string, analyticsData: any): Promise<string> {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes("revenue") && lowerQuery.includes("drop")) {
    return `Based on my analysis, revenue may have dropped due to fewer bookings or lower average order value.

**Recommendations:**
1. Launch a promotional campaign to attract more customers
2. Focus on upselling premium services
3. Consider targeted offers for regular customers`;
  }
  
  return `Here's what I found:

**Key Metrics:**
- Total Revenue: ₹${analyticsData.totalRevenue?.toLocaleString() || 0}
- Total Bookings: ${analyticsData.totalBookings || 0}
- Completion Rate: ${analyticsData.completionRate || 0}%
- Average Order Value: ₹${analyticsData.avgOrderValue?.toLocaleString() || 0}

Would you like me to analyze any specific aspect in detail?`;
}
