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

    const systemPrompt = `You are the Shashti AI Master Detailer. Your task is to generate a professional "Car-Care Journal" and "Resale Value Certificate".
    Analyze the history and prove how the use of premium products like Gtechniq, Koch Chemie, and CarPro has preserved the vehicle's value.
    
    Respond ONLY with a JSON object:
    {
      "health_score": number (0-100),
      "journal_header": "High-end title for the vehicle status",
      "health_summary": "Professional technical summary in markdown",
      "premium_product_proof": "List how specific high-end products protected this car",
      "paint_status": "Specific grade for paint depth and gloss",
      "interior_status": "Condition of leather/fabric",
      "protection_status": "Remaining lifespan of ceramic/PPF",
      "resale_value_impact": "Estimated percentage protection of resale value vs standard cars",
      "next_milestone": "Next critical maintenance step"
    }`;

    const userPrompt = `
      Vehicle Specs: ${vehicle.brand} ${vehicle.model} (${vehicle.year}), Color: ${vehicle.color}
      Full Maintenance Log: ${bookings?.map((b: any) => `${b.date}: ${b.service?.name}`).join(", ")}
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
