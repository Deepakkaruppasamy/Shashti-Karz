import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { command } = await req.json();
    const supabase = await createClient();

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      You are Shashti AI, an admin assistant for a car detailing platform.
      The admin typed this command: "${command}"
      
      Based on this command, identify the intent and suggest the best action or query.
      Possible intents:
      - Search bookings (by date, status, name)
      - Generate reports (revenue, inventory, performance)
      - View analytics
      - Manage workers
      - Send notifications
      
      Today's date is ${new Date().toLocaleDateString()}.
      
      Return a JSON response with:
      1. "intent": The identified intent.
      2. "action": The action to take (e.g., "redirect", "query", "generate").
      3. "target": The target URL or API endpoint.
      4. "message": A friendly confirmation message.
      5. "query_params": Any parameters needed for the action.
      
      Example for "Bookings pending today":
      {
        "intent": "search_bookings",
        "action": "redirect",
        "target": "/admin/bookings",
        "query_params": { "status": "pending", "date": "today" },
        "message": "I'm pulling up all pending bookings for today."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const aiData = jsonMatch ? JSON.parse(jsonMatch[0]) : { message: text };

    return NextResponse.json(aiData);
  } catch (error) {
    console.error("Admin Command Error:", error);
    return NextResponse.json({ error: "Failed to process command" }, { status: 500 });
  }
}
