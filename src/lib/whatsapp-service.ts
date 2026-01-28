export const WHATSAPP_TEMPLATES = {
    booking_confirmation: {
        en: "Hello {{1}}! Your booking at Shashti Karz is confirmed.\n\nService: {{2}}\nDate: {{3}}\nTime: {{4}}\nBooking ID: {{5}}\n\nWe look forward to seeing you!",
        ta: "வணக்கம் {{1}}! ஷஷ்டி கார்ஸில் உங்கள் முன்பதிவு உறுதிப்படுத்தப்பட்டது.\n\nசேவை: {{2}}\nதேதி: {{3}}\nநேரம்: {{4}}\nமுன்பதிவு ID: {{5}}",
    },
    service_started: {
        en: "Hi {{1}}! Great news - we've started working on your {{2}}. We'll update you as we progress!",
        ta: "வணக்கம் {{1}}! உங்கள் {{2}} பணி தொடங்கிவிட்டது. நாங்கள் முன்னேறும்போது உங்களைப் புதுப்பிப்போம்!",
    },
    service_completed: {
        en: "Hi {{1}}! Your {{2}} is complete. Your vehicle is ready for pickup!\n\nTotal: ₹{{3}}\n\nThank you for choosing Shashti Karz!",
        ta: "வணக்கம் {{1}}! உங்கள் {{2}} முடிந்தது. உங்கள் வாகனம் எடுக்க தயாராக உள்ளது!\n\nமொத்தம்: ₹{{3}}",
    },
    reminder: {
        en: "Hi {{1}}! This is a reminder for your upcoming appointment at Shashti Karz tomorrow at {{2}}. See you soon!",
        ta: "வணக்கம் {{1}}! நாளை {{2}} மணிக்கு ஷஷ்டி கார்ஸில் உங்கள் சந்திப்புக்கான நினைவூட்டல். விரைவில் சந்திப்போம்!",
    },
    review_request: {
        en: "Hi {{1}}! We hope you loved your recent {{2}} at Shashti Karz. Would you mind leaving us a review? It helps us serve you better!\n\n{{3}}",
        ta: "வணக்கம் {{1}}! ஷஷ்டி கார்ஸில் உங்கள் சமீபத்திய {{2}} உங்களுக்கு பிடித்திருக்கும் என்று நம்புகிறோம். எங்களுக்கு ஒரு மதிப்புரை வழங்க முடியுமா?",
    },
    referral_success: {
        en: "Hi {{1}}! Great news - your friend {{2}} just booked with us using your referral code! You've earned ₹{{3}} in rewards. Keep referring!",
        ta: "வணக்கம் {{1}}! உங்கள் நண்பர் {{2}} உங்கள் பரிந்துரை குறியீட்டைப் பயன்படுத்தி இப்போது எங்களிடம் முன்பதிவு செய்தார்! நீங்கள் ₹{{3}} வெகுமதி பெற்றுள்ளீர்கள்!",
    },
    custom_message: {
        en: "{{1}}",
        ta: "{{1}}",
    },
};


export function formatWhatsAppTemplate(template: string, params: string[]): string {
    let formatted = template;
    params.forEach((param, index) => {
        formatted = formatted.replace(`{{${index + 1}}}`, param);
    });
    return formatted;
}

export async function sendWhatsAppMessage(phone: string, templateName: string, params: string[], language: string = "en") {
    const templates = WHATSAPP_TEMPLATES[templateName as keyof typeof WHATSAPP_TEMPLATES];
    if (!templates) {
        throw new Error(`Template '${templateName}' not found`);
    }

    const template = templates[language as keyof typeof templates] || templates.en;
    const message = formatWhatsAppTemplate(template, params || []);

    const formattedPhone = phone.replace(/[^0-9]/g, "");
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

    console.log(`[WhatsApp Service] Sending to ${phone}:`, message);

    return {
        success: true,
        phone: formattedPhone,
        message,
        whatsapp_url: whatsappUrl,
        template_used: templateName,
        language,
        simulated: true,
    };
}
