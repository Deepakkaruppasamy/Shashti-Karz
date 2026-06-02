
const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`;
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

interface WhatsAppMessage {
    to: string;
    type: 'text' | 'template' | 'image' | 'document';
    body?: string;
    template?: {
        name: string;
        language: string;
        components?: any[];
    };
    image?: {
        link: string;
        caption?: string;
    };
}

export async function sendWhatsAppText(to: string, message: string) {
    try {
        const response = await fetch(`${WHATSAPP_API_URL}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to.replace(/[^0-9]/g, ''),
                type: 'text',
                text: {
                    preview_url: false,
                    body: message,
                },
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to send WhatsApp message');
        }

        return data;
    } catch (error) {
        console.error('WhatsApp send error:', error);
        throw error;
    }
}

export async function sendWhatsAppTemplate(
    to: string,
    templateName: string,
    language: string = 'en',
    components?: any[]
) {
    try {
        const response = await fetch(`${WHATSAPP_API_URL}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: to.replace(/[^0-9]/g, ''),
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: language,
                    },
                    components: components || [],
                },
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to send template');
        }

        return data;
    } catch (error) {
        console.error('WhatsApp template error:', error);
        throw error;
    }
}

export async function sendBookingConfirmation(booking: any) {
    const message = `
🎉 *Booking Confirmed!*

📅 Date: ${new Date(booking.booking_date).toLocaleDateString()}
🕐 Time: ${booking.time_slot}
🚗 Car: ${booking.car_model}
🧼 Service: ${booking.service_name}
💰 Amount: ₹${booking.total_amount}

📍 Location: ${booking.location}

We'll send you updates as your service progresses!

Reply RESCHEDULE to change timing
Reply CANCEL to cancel booking

Thank you for choosing Shashti Karz! ✨
  `.trim();

    return sendWhatsAppText(booking.customer_phone, message);
}

export async function sendServiceUpdate(booking: any, status: string) {
    const statusMessages: Record<string, string> = {
        'confirmed': '✅ Your service is confirmed!',
        'worker_assigned': '👨‍🔧 Worker assigned and on the way!',
        'in_progress': '🚿 Service in progress...',
        'completed': '✨ Service completed! Please rate us.',
        'cancelled': '❌ Booking cancelled.',
    };

    const message = `
${statusMessages[status] || '📢 Service Update'}

Booking ID: ${booking.id.slice(0, 8)}
Service: ${booking.service_name}
Status: ${status}

Track live: https://shasthi-karz.com/track/${booking.id}
  `.trim();

    return sendWhatsAppText(booking.customer_phone, message);
}

export async function sendPaymentReminder(booking: any) {
    const message = `
💳 *Payment Reminder*

Hi ${booking.customer_name},

Your booking is confirmed but payment is pending:

Amount Due: ₹${booking.total_amount}
Service: ${booking.service_name}
Date: ${new Date(booking.booking_date).toLocaleDateString()}

Pay now: https://shasthi-karz.com/pay/${booking.id}

Complete payment to confirm your slot!
  `.trim();

    return sendWhatsAppText(booking.customer_phone, message);
}

export async function sendBroadcastMessage(
    phoneNumbers: string[],
    message: string
) {
    const results = [];

    for (const phone of phoneNumbers) {
        try {
            const result = await sendWhatsAppText(phone, message);
            results.push({ phone, success: true, result });

            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            results.push({ phone, success: false, error });
        }
    }

    return results;
}

export async function markMessageAsRead(messageId: string) {
    try {
        const response = await fetch(`${WHATSAPP_API_URL}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId,
            }),
        });

        return await response.json();
    } catch (error) {
        console.error('Mark read error:', error);
        throw error;
    }
}
