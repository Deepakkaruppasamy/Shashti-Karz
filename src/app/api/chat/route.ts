import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { buildSystemPrompt, classifyIntent, type UserRole } from "@/lib/shashti-ai";
import { chatWithGemini } from "@/lib/gemini";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getServicesData() {
  const supabase = getSupabase();
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("active", true);
  return services || [];
}

async function getOffersData() {
  const supabase = getSupabase();
  const { data: offers } = await supabase
    .from("offers")
    .select("*")
    .eq("active", true);
  return offers || [];
}

async function getCarTypesData() {
  const supabase = getSupabase();
  const { data: carTypes } = await supabase.from("car_types").select("*");
  return carTypes || [];
}

export async function POST(request: Request) {
  console.log("Chat POST request received");
  try {
    const { messages, context } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const [services, offers, carTypes] = await Promise.all([
      getServicesData(),
      getOffersData(),
      getCarTypesData(),
    ]);

    const userRole: UserRole = context?.role || "guest";
      const systemPrompt = buildSystemPrompt(userRole, services, offers, carTypes, {
        userName: context?.userName,
        language: context?.language,
        loyaltyData: context?.loyaltyTier ? { tier: context.loyaltyTier } : undefined,
      });


    const lastMessage = messages[messages.length - 1]?.content || "";
    const intent = classifyIntent(lastMessage);

    const assistantMessage = await chatWithGemini(messages, systemPrompt);
    console.log("Gemini response generated successfully");

    // Save messages to database if user is logged in
    if (context?.userId) {
      try {
        const supabase = getSupabase();
        await supabase.from("ai_chat_messages").insert([
          {
            user_id: context.userId,
            role: "user",
            content: lastMessage,
            intent: intent.name,
            context: {
              language: context.language,
              page: context.currentPage
            }
          },
          {
            user_id: context.userId,
            role: "assistant",
            content: assistantMessage,
            context: {
              intent_confidence: intent.confidence
            }
          }
        ]);
      } catch (dbError) {
        console.error("Failed to save chat to database:", dbError);
      }
    }

    return NextResponse.json({ 
      message: assistantMessage,
      intent: intent.name,
      confidence: intent.confidence
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    
    return NextResponse.json(
      { error: "Failed to process message. Please try again." },
      { status: 500 }
    );
  }
}
