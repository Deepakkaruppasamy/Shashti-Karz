/**
 * Multi-language support for Dinesh Voice Assistant
 * Supports English, Tamil, and Hindi
 */

export interface LanguageResponse {
    greeting: string;
    bookingResponse: string;
    servicesResponse: string;
    pricingResponse: string;
    supportResponse: string;
    thanksResponse: string;
    helpResponse: string;
    defaultResponse: string;
    home: string;
}

export const languageResponses: Record<"en-US" | "ta-IN" | "hi-IN", LanguageResponse> = {
    "en-US": {
        greeting: "Hello! I'm Dinesh, your voice assistant for Shashti Karz. How can I help you today?",
        bookingResponse: "Let me open the booking page for you. You can schedule your car detailing service there.",
        servicesResponse: "Here are all our car detailing services. We offer exterior wash, interior cleaning, ceramic coating, and more.",
        pricingResponse: "Our pricing depends on your car type and the service you choose. Let me show you our smart price calculator.",
        supportResponse: "I'm here to help! Please tell me about your issue, and I'll either assist you or create a support ticket for our admin team.",
        thanksResponse: "You're very welcome! I'm always here to help. Is there anything else you'd like to know?",
        helpResponse: "I can help you navigate the website, book services, answer questions about our services, explain pricing, and much more!",
        defaultResponse: "I'm here to help! You can ask me to navigate to different pages, book services, track your orders, check pricing, or get support.",
        home: "Taking you to the homepage now."
    },
    "ta-IN": {
        greeting: "வணக்கம்! நான் திநேஷ், ஷஷ்டி கார்ஸ் குரல் உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
        bookingResponse: "புக்கிங் பக்கத்தை திறக்கிறேன். நீங்கள் கார் டீட்டெய்லிங் சேவையை அங்கு திட்டமிடலாம்.",
        servicesResponse: "எங்கள் அனைத்து கார் டீட்டெய்லிங் சேவைகள் இங்கே உள்ளன். வெளிப்புற சுத்தம், உள்துறை சுத்தம், செராமிக் கோட்டிங் மற்றும் பல.",
        pricingResponse: "உங்கள் கார் வகை மற்றும் சேவையை பொறுத்து விலை மாறுபடும். எங்கள் விலை கால்குலேட்டரை காட்டுகிறேன்.",
        supportResponse: "நான் உதவ இங்கே இருக்கிறேன்! உங்கள் பிரச்சனையை சொல்லுங்கள், நான் உதவுவேன் அல்லது எங்கள் அட்மின் டீமுக்கு டிக்கெட் உருவாக்குவேன்.",
        thanksResponse: "நல்வரவு! நான் எப்போதும் உதவ இங்கே இருக்கிறேன். வேறு ஏதாவது தெரிந்து கொள்ள விரும்புகிறீர்களா?",
        helpResponse: "நான் இணையதளத்தில் செல்ல, சேவைகளை புக் செய்ய, கேள்விகளுக்கு பதிலளிக்க, விலையை விளக்க மற்றும் பலவற்றுக்கு உதவ முடியும்!",
        defaultResponse: "நான் உதவ இங்கே இருக்கிறேன்! பக்கங்களுக்கு செல்ல, சேவைகளை புக் செய்ய, ஆர்டர்களை கண்காணிக்க, விலையை சரிபார்க்க அல்லது ஆதரவைப் பெற என்னிடம் கேட்கலாம்.",
        home: "இப்போது உங்களை முகப்புப் பக்கத்திற்கு அழைத்துச் செல்கிறேன்."
    },
    "hi-IN": {
        greeting: "नमस्ते! मैं दिनेश हूं, शाश्ती कार्ज़ के लिए आपका वॉयस असिस्टेंट। आज मैं आपकी कैसे मदद कर सकता हूं?",
        bookingResponse: "मैं आपके लिए बुकिंग पेज खोल रहा हूं। आप वहां अपनी कार डिटेलिंग सर्विस शेड्यूल कर सकते हैं।",
        servicesResponse: "यहां हमारी सभी कार डिटेलिंग सेवाएं हैं। हम बाहरी धुलाई, आंतरिक सफाई, सिरेमिक कोटिंग और बहुत कुछ प्रदान करते हैं।",
        pricingResponse: "हमारी कीमतें आपकी कार के प्रकार और सेवा पर निर्भर करती हैं। मैं आपको हमारा स्मार्ट प्राइस कैलकुलेटर दिखाता हूं।",
        supportResponse: "मैं मदद के लिए यहाँ हूँ! कृपया मुझे अपनी समस्या बताएं, और मैं या तो आपकी मदद करूंगा या हमारी एडमिन टीम के लिए सपोर्ट टिकट बनाऊंगा।",
        thanksResponse: "आपका स्वागत है! मैं हमेशा मदद के लिए यहाँ हूँ। क्या आप कुछ और जानना चाहेंगे?",
        helpResponse: "मैं वेबसाइट पर नेविगेट करने, सेवाओं को बुक करने, प्रश्नों के उत्तर देने, मूल्य निर्धारण की व्याख्या करने और बहुत कुछ में मदद कर सकता हूं!",
        defaultResponse: "मैं मदद के लिए यहाँ हूँ! आप मुझसे विभिन्न पृष्ठों पर जाने, सेवाओं को बुक करने, अपने ऑर्डर को ट्रैक करने, मूल्य निर्धारण की जांच करने या सहायता प्राप्त करने के लिए कह सकते हैं।",
        home: "अब आपको होमपेज पर ले जा रहा हूं।"
    }
};

/**
 * Detect language from query
 */
export function detectLanguage(query: string): "en-US" | "ta-IN" | "hi-IN" {
    // Tamil script detection
    if (/[\u0B80-\u0BFF]/.test(query)) {
        return "ta-IN";
    }

    // Devanagari script (Hindi) detection
    if (/[\u0900-\u097F]/.test(query)) {
        return "hi-IN";
    }

    // Default to English
    return "en-US";
}

/**
 * Multi-language command keywords
 */
export const commandKeywords = {
    booking: {
        "en-US": ["book", "booking", "appointment", "schedule"],
        "ta-IN": ["புக்", "புக்கிங்", "சந்திப்பு", "அட்டவணை"],
        "hi-IN": ["बुक", "बुकिंग", "अपॉइंटमेंट", "शेड्यूल"]
    },
    services: {
        "en-US": ["service", "services", "what do you offer"],
        "ta-IN": ["சேவை", "சேவைகள்", "என்ன வழங்குகிறீர்கள்"],
        "hi-IN": ["सेवा", "सेवाएं", "आप क्या प्रदान करते हैं"]
    },
    pricing: {
        "en-US": ["price", "pricing", "cost", "how much"],
        "ta-IN": ["விலை", "விலை நிர்ணயம்", "செலவு", "எவ்வளவு"],
        "hi-IN": ["कीमत", "मूल्य निर्धारण", "लागत", "कितना"]
    },
    help: {
        "en-US": ["help", "support", "issue", "problem"],
        "ta-IN": ["உதவி", "ஆதரவு", "பிரச்சினை", "சிக்கல்"],
        "hi-IN": ["मदद", "सहायता", "समस्या", "इश्यू"]
    },
    thanks: {
        "en-US": ["thank", "thanks", "thank you"],
        "ta-IN": ["நன்றி", "நன்றிகள்"],
        "hi-IN": ["धन्यवाद", "शुक्रिया"]
    },
    home: {
        "en-US": ["home", "homepage", "main page"],
        "ta-IN": ["முகப்பு", "முகப்பு பக்கம்", "மெயின் பேஜ்"],
        "hi-IN": ["होम", "होमपेज", "मुख्य पृष्ठ"]
    },
    track: {
        "en-US": ["track", "my booking", "order status"],
        "ta-IN": ["கண்காணி", "என் புக்கிங்", "ஆர்டர் நிலை"],
        "hi-IN": ["ट्रैक", "मेरी बुकिंग", "ऑर्डर स्टेटस"]
    }
};

/**
 * Check if query contains any keyword from a category
 */
export function matchesCategory(query: string, category: keyof typeof commandKeywords, language: "en-US" | "ta-IN" | "hi-IN"): boolean {
    const keywords = commandKeywords[category][language];
    return keywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()));
}
