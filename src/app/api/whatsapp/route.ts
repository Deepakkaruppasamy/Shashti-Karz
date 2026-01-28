import { NextResponse } from "next/server";
import { sendWhatsAppMessage, WHATSAPP_TEMPLATES } from "@/lib/whatsapp-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, template_name, params, language = "en" } = body;

    if (!phone || !template_name) {
      return NextResponse.json(
        { error: "Phone and template_name are required" },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMessage(phone, template_name, params, language);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('not found') ? 404 : 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    available_templates: Object.keys(WHATSAPP_TEMPLATES),
    languages: ["en", "ta"],
    note: "This is a simulated WhatsApp integration. In production, integrate with WhatsApp Business API.",
  });
}

