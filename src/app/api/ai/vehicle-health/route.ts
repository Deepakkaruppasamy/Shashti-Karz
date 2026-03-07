import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatWithGemini } from "@/lib/gemini";

// Centralized AI utility (Groq with Gemini fallback)

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

    const systemPrompt = `Analyze the car detailing service history and generate a health summary. Respond ONLY with a JSON object.
    Required format:
    {
      "health_score": number (0-100),
      "health_summary": string (markdown),
      "paint_status": string,
      "interior_status": string,
      "protection_status": string,
      "resale_value_insight": string,
      "next_recommended_service": string
    }`;

    const userPrompt = `
      Vehicle: ${vehicle.brand} ${vehicle.model} (${vehicle.year})
      Color: ${vehicle.color}
      Timeline: ${bookings?.map(b => `${b.date}: ${b.service?.name}`).join(", ")}
    `;

    const text = await chatWithGemini([{ role: "user", content: userPrompt }], systemPrompt);

    // Parse the JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const aiData = jsonMatch ? JSON.parse(jsonMatch[0]) : { health_summary: text };

    // Update vehicle with the summary (if columns exist, otherwise just return)
    // For now, we'll just return it to the frontend

    return NextResponse.json(aiData);
  } catch (error) {
    console.error("AI Health Error:", error);
    return NextResponse.json({ error: "Failed to generate health summary" }, { status: 500 });
  }
}
