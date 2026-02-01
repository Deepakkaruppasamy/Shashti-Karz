import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const { query, language = "en-US" } = await req.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Build context-aware prompt with business information
        const businessContext = `
You are Dinesh, a friendly and helpful voice assistant for Shashti Karz, a premium car detailing service.

BUSINESS INFORMATION:
- Company: Shashti Karz - Car Detailing Xpert
- Services: Exterior wash, interior cleaning, ceramic coating, polishing, waxing, paint protection, headlight restoration, engine bay cleaning
- Specialty: Premium car detailing with professional-grade products
- Features: Online booking system, loyalty rewards program, real-time service tracking
- Voice Assistant: You (Dinesh) - available in English, Tamil, and Hindi

IMPORTANT INSTRUCTIONS:
1. Answer questions naturally and conversationally
2. For website-specific questions, use the business information above
3. For general questions (weather, news, general knowledge), answer helpfully
4. Keep responses concise (2-3 sentences max)
5. Be friendly and professional
6. If asked about pricing, mention it depends on car type and service, and suggest using the price calculator
7. If asked about booking, encourage them to use the booking page
8. CRITICAL: Respond in the SAME LANGUAGE as the user's query

LANGUAGE DETECTION:
- If query contains Tamil script (தமிழ்), respond in Tamil
- If query contains Hindi script (हिंदी), respond in Hindi  
- Otherwise, respond in English

Current language preference: ${language === "ta-IN" ? "Tamil" : language === "hi-IN" ? "Hindi" : "English"}
`;

        const prompt = `${businessContext}

User Query: "${query}"

Your Response (in ${language === "ta-IN" ? "Tamil" : language === "hi-IN" ? "Hindi" : "English"}):`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({
            success: true,
            response: text.trim(),
            language
        });

    } catch (error: any) {
        console.error("Dinesh AI Chat Error:", error);
        return NextResponse.json(
            {
                error: "Failed to process query",
                fallback: "I'm having trouble right now. Please try asking again or contact support."
            },
            { status: 500 }
        );
    }
}
