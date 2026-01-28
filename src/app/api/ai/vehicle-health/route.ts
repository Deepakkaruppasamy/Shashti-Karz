import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google-generative-ai/generative-ai";
import { createClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { vehicleId } = await req.json();
    const supabase = await createClient();

    // Fetch vehicle details
    const { data: vehicle, error: vehicleError } = await supabase
      .from("user_vehicles")
      .select("*")
      .eq("id", vehicleId)
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Fetch service history
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*, service:services(*)")
      .eq("car_model", vehicle.model) // or use a more precise link if available
      .eq("status", "completed")
      .order("date", { ascending: false });

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Analyze the following car service history and generate a health summary and a resale-friendly report.
      
      Vehicle: ${vehicle.brand} ${vehicle.model} (${vehicle.year})
      Color: ${vehicle.color}
      Total Services: ${bookings?.length || 0}
      
      Service History:
      ${bookings?.map(b => `- ${b.date}: ${b.service?.name} (Price: ${b.price})`).join("\n")}
      
      Please provide:
      1. Health Score (0-100)
      2. AI Health Summary (concise paragraphs)
      3. Component Status (Paint, Interior, Protection)
      4. Resale Value Insight (How well is the value maintained)
      5. Next Recommended Service
      
      Return the response as a JSON object.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const aiData = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text };

    // Update vehicle with the summary (if columns exist, otherwise just return)
    // For now, we'll just return it to the frontend
    
    return NextResponse.json(aiData);
  } catch (error) {
    console.error("AI Health Error:", error);
    return NextResponse.json({ error: "Failed to generate health summary" }, { status: 500 });
  }
}
