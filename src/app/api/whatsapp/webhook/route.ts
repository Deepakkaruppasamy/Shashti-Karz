import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/whatsapp/webhook - Handle WhatsApp webhooks
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const supabase = await createClient();

        // WhatsApp webhook structure
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (!messages || messages.length === 0) {
            return NextResponse.json({ status: "no messages" });
        }

        const message = messages[0];
        const from = message.from;
        const messageText = message.text?.body;
        const messageType = message.type;

        // Process message
        const { data: response, error } = await supabase.rpc(
            "process_whatsapp_message",
            {
                phone_number_param: from,
                message_text: messageText || "",
            }
        );

        if (error) {
            console.error("Error processing WhatsApp message:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Store incoming message
        await supabase.from("whatsapp_messages").insert({
            session_id: response.session_id,
            direction: "inbound",
            message_type: messageType,
            content: messageText,
            message_id: message.id,
        });

        // Send response back
        // In production, use WhatsApp Business API to send the response
        console.log("WhatsApp Response:", response.response);

        return NextResponse.json({ status: "processed", response: response.response });
    } catch (error) {
        console.error("Error handling WhatsApp webhook:", error);
        return NextResponse.json(
            { error: "Failed to process webhook" },
            { status: 500 }
        );
    }
}

// GET /api/whatsapp/webhook - Verify webhook
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "shashti_karz_verify";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid verification" }, { status: 403 });
}
