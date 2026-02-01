/**
 * Deep AI Service Recommendations for Dinesh
 * Analyzes user queries and suggests relevant services
 */

export interface ServiceRecommendation {
    id: string; // specialized ID for looking up translations
    serviceName: string;
    reason: string;
    priority: "high" | "medium" | "low";
    keywords: string[];
    keywords_ta: string[];
    keywords_hi: string[];
}

// Translations for Service Names and Reasons
const translations = {
    "ceramic_coating": {
        name: {
            "en-US": "Ceramic Coating",
            "ta-IN": "செராமிக் கோட்டிங்",
            "hi-IN": "सिरेमिक कोटिंग"
        },
        reason: {
            "en-US": "Provides long-lasting protection against scratches, UV rays, and water spots",
            "ta-IN": "கீறல்கள், வெயில் மற்றும் நீர் கறைகளுக்கு எதிராக நீண்ட கால பாதுகாப்பை வழங்குகிறது",
            "hi-IN": "खरोंच, धूप और पानी के धब्बों के खिलाफ लंबे समय तक चलने वाली सुरक्षा प्रदान करता है"
        }
    },
    "ppf": {
        name: {
            "en-US": "Paint Protection Film (PPF)",
            "ta-IN": "பெயிண்ட் பாதுகாப்பு ஃபிலிம் (PPF)",
            "hi-IN": "पेंट प्रोटेक्शन फिल्म (PPF)"
        },
        reason: {
            "en-US": "Best protection against rock chips, scratches, and environmental damage",
            "ta-IN": "கற்கள் மற்றும் கீறல்களில் இருந்து சிறந்த பாதுகாப்பு",
            "hi-IN": "पत्थर की चिप्स और खरोंच से सबसे अच्छी सुरक्षा"
        }
    },
    "polishing": {
        name: {
            "en-US": "Paint Polishing",
            "ta-IN": "பெயிண்ட் பாலிஷ்",
            "hi-IN": "पेंट पॉलिशिंग"
        },
        reason: {
            "en-US": "Removes minor scratches, swirl marks, and restores shine",
            "ta-IN": "சிறிய கீறல்களை நீக்கி மீண்டும் பளபளப்பாக்கும்",
            "hi-IN": "मामूली खरोंचों को हटाता है और चमक वापस लाता है"
        }
    },
    "full_detailing": {
        name: {
            "en-US": "Full Detailing",
            "ta-IN": "முழுமையான பராமரிப்பு",
            "hi-IN": "फुल डिटेलिंग"
        },
        reason: {
            "en-US": "Complete deep cleaning and restoration of your vehicle",
            "ta-IN": "உங்கள் வாகனத்தின் முழுமையான ஆழமான சுத்தம்",
            "hi-IN": "आपके वाहन की पूरी गहरी सफाई"
        }
    },
    "interior_cleaning": {
        name: {
            "en-US": "Interior Deep Cleaning",
            "ta-IN": "உட்புற ஆழமான சுத்தம்",
            "hi-IN": "इंटीरियर डीप क्लीनिंग"
        },
        reason: {
            "en-US": "Professional cleaning for stains, odors, and complete cabin restoration",
            "ta-IN": "கறைகள் மற்றும் துர்நாற்றத்தை நீக்குவதற்கான தொழில்முறை சுத்தம்",
            "hi-IN": "दाग और बदबू के लिए पेशेवर सफाई"
        }
    },
    "odor_removal": {
        name: {
            "en-US": "Odor Removal & AC Sanitization",
            "ta-IN": "துர்நாற்றம் நீக்கம் மற்றும் ஏசி சுத்தம்",
            "hi-IN": "गंध हटाना और एसी सैनिटाइजेशन"
        },
        reason: {
            "en-US": "Eliminates bad smells and sanitizes air conditioning system",
            "ta-IN": "கெட்ட வாசனையை நீக்கி ஏசியை சுத்தம் செய்கிறது",
            "hi-IN": "बदबू को खत्म करता है और एसी को साफ करता है"
        }
    },
    "leather_care": {
        name: {
            "en-US": "Leather Conditioning",
            "ta-IN": "லெதர் பராமரிப்பு",
            "hi-IN": "लेदर कंडीशनिंग"
        },
        reason: {
            "en-US": "Preserves and protects leather seats from cracking and fading",
            "ta-IN": "லெதர் சீட்களை பாதுகாக்க உதவுகிறது",
            "hi-IN": "लेदर सीटों को फटने से बचाने में मदद करता है"
        }
    },
    "headlight": {
        name: {
            "en-US": "Headlight Restoration",
            "ta-IN": "ஹெட்லைட் புதுப்பித்தல்",
            "hi-IN": "हेडलाइट रेस्टोरेशन"
        },
        reason: {
            "en-US": "Removes yellowing and cloudiness, improves visibility and appearance",
            "ta-IN": "மஞ்சள் நிறத்தை நீக்கி வெளிச்சத்தை அதிகரிக்கிறது",
            "hi-IN": "पीलापन हटाता है और रोशनी में सुधार करता है"
        }
    },
    "wheels": {
        name: {
            "en-US": "Wheel & Tire Detailing",
            "ta-IN": "வீல் மற்றும் டயர் சுத்தம்",
            "hi-IN": "व्हील और टायर डिटेलिंग"
        },
        reason: {
            "en-US": "Deep cleaning and dressing for showroom-look wheels",
            "ta-IN": "வீல் மற்றும் டயர்களை புதியது போல் மாற்றும்",
            "hi-IN": "पहियों को शोरूम जैसा लुक देता है"
        }
    },
    "engine": {
        name: {
            "en-US": "Engine Bay Detailing",
            "ta-IN": "இன்ஜின் சுத்தம்",
            "hi-IN": "इंजन बे डिटेलिंग"
        },
        reason: {
            "en-US": "Professional engine cleaning for better maintenance and appearance",
            "ta-IN": "சிறந்த பராமரிப்புக்காக இன்ஜின் சுத்தம்",
            "hi-IN": "बेहतर रखरखाव के लिए इंजन की सफाई"
        }
    },
    "wash_wax": {
        name: {
            "en-US": "Exterior Wash & Wax",
            "ta-IN": "வெளிப்புற வாஷ் மற்றும் வாக்ஸ்",
            "hi-IN": "एक्सटीरियर वॉश और वैक्स"
        },
        reason: {
            "en-US": "Regular maintenance wash with protective wax layer",
            "ta-IN": "வழக்கமான வாஷ் மற்றும் வாக்ஸ் பாதுகாப்பு",
            "hi-IN": "सुरक्षात्मक वैक्स के साथ नियमित धुलाई"
        }
    },
    "new_car": {
        name: {
            "en-US": "New Car Protection Package",
            "ta-IN": "புதிய கார் பாதுகாப்பு தொகுப்பு",
            "hi-IN": "नई कार सुरक्षा पैकेज"
        },
        reason: {
            "en-US": "Complete protection for your new vehicle from day one",
            "ta-IN": "உங்கள் புதிய காருக்கு முழு பாதுகாப்பு",
            "hi-IN": "आपकी नई कार के लिए पूरी सुरक्षा"
        }
    },
    "luxury": {
        name: {
            "en-US": "Premium Detailing Package",
            "ta-IN": "பிரீமியம் டீட்டெய்லிங்",
            "hi-IN": "प्रीमियम डिटेलिंग पैकेज"
        },
        reason: {
            "en-US": "Specialized care for luxury and high-end vehicles",
            "ta-IN": "லக்ஸரி கார்களுக்கான சிறப்பு கவனிப்பு",
            "hi-IN": "लक्जरी कारों के लिए विशेष देखभाल"
        }
    }
};

/**
 * Service recommendation rules based on query analysis
 */
const recommendationRules: ServiceRecommendation[] = [
    // Paint-related issues
    {
        id: "ceramic_coating",
        serviceName: "Ceramic Coating",
        reason: "Provides long-lasting protection against scratches, UV rays, and water spots",
        priority: "high",
        keywords: ["scratch", "protect", "shine", "gloss", "water spot", "swirl", "dull paint", "faded", "oxidation"],
        keywords_ta: ["கீறல்", "பாதுகாப்பு", "பளபளப்பு", "வாட்டர் ஸ்பாட்", "மங்கிய", "வெயில்"],
        keywords_hi: ["खरोंच", "सुरक्षा", "चमक", "पानी के निशान", "धूप", "फिका"]
    },
    {
        id: "ppf",
        serviceName: "Paint Protection Film (PPF)",
        reason: "Best protection against rock chips, scratches, and environmental damage",
        priority: "high",
        keywords: ["rock chip", "stone chip", "scratch protection", "new car", "luxury", "premium", "high-end"],
        keywords_ta: ["கல்", "கீறல் பாதுகாப்பு", "புதிய கார்", "லக்ஸரி"],
        keywords_hi: ["पत्थर", "खरोंच सुरक्षा", "नई कार", "लक्जरी"]
    },
    {
        id: "polishing",
        serviceName: "Paint Polishing",
        reason: "Removes minor scratches, swirl marks, and restores shine",
        priority: "medium",
        keywords: ["swirl marks", "minor scratch", "dull paint", "restore shine", "polish"],
        keywords_ta: ["சிறிய கீறல்", "பாலிஷ்", "பளபளப்பு"],
        keywords_hi: ["मामूली खरोंच", "पॉलिश", "चमक"]
    },

    // Water and cleanliness issues
    {
        id: "ceramic_coating",
        serviceName: "Ceramic Coating", // Duplicate for different context, handled by ID
        reason: "Creates a hydrophobic surface for easy water beading and self-cleaning effect",
        priority: "high",
        keywords: ["water spot", "hard water", "rain marks", "water bead", "easy clean", "hydrophobic"],
        keywords_ta: ["தண்ணீர் கறை", "நீர் திவலை", "சுத்தம்"],
        keywords_hi: ["पानी के धब्बे", "जल", "सफाई"]
    },
    {
        id: "full_detailing",
        serviceName: "Full Detailing",
        reason: "Complete deep cleaning and restoration of your vehicle",
        priority: "medium",
        keywords: ["dirty", "very dirty", "deep clean", "complete clean", "full service", "make it new"],
        keywords_ta: ["அழுக்கு", "சுத்தம்", "முழு சர்வீஸ்", "புதியது போல்"],
        keywords_hi: ["गंदा", "गहरी सफाई", "पूरी सर्विस", "नई जैसी"]
    },

    // Interior issues
    {
        id: "interior_cleaning",
        serviceName: "Interior Deep Cleaning",
        reason: "Professional cleaning for stains, odors, and complete cabin restoration",
        priority: "high",
        keywords: ["smell", "odor", "stain", "dirty seat", "dashboard", "interior", "cabin", "upholstery"],
        keywords_ta: ["நாற்றம்", "கறை", "உட்புறம்", "சீட்", "டேஷ்போர்டு"],
        keywords_hi: ["बदबू", "दाग", "गंध", "इंटीरियर", "सीट"]
    },
    {
        id: "odor_removal",
        serviceName: "Odor Removal & AC Sanitization",
        reason: "Eliminates bad smells and sanitizes air conditioning system",
        priority: "high",
        keywords: ["smell", "bad smell", "odor", "smoke smell", "pet smell", "musty", "ac smell", "ventilation"],
        keywords_ta: ["கெட்ட நாற்றம்", "ஏசி நாற்றம்", "புகை"],
        keywords_hi: ["बुरी गंध", "एसी गंध", "धुआं"]
    },
    {
        id: "leather_care",
        serviceName: "Leather Conditioning",
        reason: "Preserves and protects leather seats from cracking and fading",
        priority: "medium",
        keywords: ["leather", "seat crack", "leather care", "leather protect"],
        keywords_ta: ["லெதர்", "லெதர் சீட்"],
        keywords_hi: ["लेदर", "चमड़े की सीट"]
    },

    // Lighting issues
    {
        id: "headlight",
        serviceName: "Headlight Restoration",
        reason: "Removes yellowing and cloudiness, improves visibility and appearance",
        priority: "high",
        keywords: ["headlight", "foggy", "yellow", "cloudy", "hazy", "dim light", "poor visibility"],
        keywords_ta: ["ஹெட்லைட்", "மஞ்சள்", "மங்கலான"],
        keywords_hi: ["हेडलाइट", "पीला", "धुंधला"]
    },

    // Wheels
    {
        id: "wheels",
        serviceName: "Wheel & Tire Detailing",
        reason: "Deep cleaning and dressing for showroom-look wheels",
        priority: "medium",
        keywords: ["wheel", "tire", "rim", "brake dust", "dirty wheel"],
        keywords_ta: ["வீல்", "டயர்", "ரிம்"],
        keywords_hi: ["पहिया", "टायर", "रिम"]
    },

    // Engine
    {
        id: "engine",
        serviceName: "Engine Bay Detailing",
        reason: "Professional engine cleaning for better maintenance and appearance",
        priority: "low",
        keywords: ["engine", "engine bay", "greasy engine", "dirty engine", "engine clean"],
        keywords_ta: ["இன்ஜின்", "இன்ஜின் சுத்தம்"],
        keywords_hi: ["इंजन", "इंजन सफाई"]
    },

    // Regular maintenance
    {
        id: "wash_wax",
        serviceName: "Exterior Wash & Wax",
        reason: "Regular maintenance wash with protective wax layer",
        priority: "medium",
        keywords: ["wash", "regular wash", "maintenance", "basic", "quick clean", "weekly"],
        keywords_ta: ["வாஷ்", "கழுவு", "சுத்தம்"],
        keywords_hi: ["धुलाई", "वॉश", "सफाई"]
    },

    // New car
    {
        id: "new_car",
        serviceName: "New Car Protection Package",
        reason: "Complete protection for your new vehicle from day one",
        priority: "high",
        keywords: ["new car", "just bought", "brand new", "protect new car"],
        keywords_ta: ["புதிய கார்", "புது வண்டி"],
        keywords_hi: ["नई कार", "नई गाड़ी"]
    },

    // Luxury
    {
        id: "luxury",
        serviceName: "Premium Detailing Package",
        reason: "Specialized care for luxury and high-end vehicles",
        priority: "high",
        keywords: ["luxury", "premium", "expensive car", "bmw", "mercedes", "audi", "high-end"],
        keywords_ta: ["லக்ஸரி", "விலையுயர்ந்த கார்"],
        keywords_hi: ["लक्जरी", "महंगी कार"]
    }
];

/**
 * Analyze query and recommend services
 */
export function getServiceRecommendations(query: string, lang: "en-US" | "ta-IN" | "hi-IN" = "en-US"): ServiceRecommendation[] {
    const lowerQuery = query.toLowerCase();
    const recommendations: ServiceRecommendation[] = [];

    recommendationRules.forEach(rule => {
        let keywordsToCheck = rule.keywords;
        if (lang === "ta-IN") keywordsToCheck = rule.keywords_ta;
        if (lang === "hi-IN") keywordsToCheck = rule.keywords_hi;

        const matches = keywordsToCheck.filter(keyword =>
            lowerQuery.includes(keyword.toLowerCase())
        );

        if (matches.length > 0) {
            // Add recommendation if not already added
            if (!recommendations.find(r => r.id === rule.id)) {
                recommendations.push({
                    ...rule,
                    // Store ALL matches for debug/highlighting if needed, but primarily we used it to trigger
                    keywords: matches
                });
            }
        }
    });

    // Sort by priority: high > medium > low
    return recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
}

/**
 * Generate a natural response with service recommendation in target language
 */
export function generateRecommendationResponse(
    query: string,
    recommendations: ServiceRecommendation[],
    lang: "en-US" | "ta-IN" | "hi-IN" = "en-US"
): string {
    if (recommendations.length === 0) {
        return "";
    }

    const topRec = recommendations[0];
    const topRecData = translations[topRec.id as keyof typeof translations];

    // Safety check if translation key is missing
    const serviceName = topRecData?.name[lang] || topRec.serviceName;
    const reason = topRecData?.reason[lang] || topRec.reason;

    let message = "";

    if (lang === "ta-IN") {
        message = `உங்கள் கேள்வியின் அடிப்படையில், நான் எங்கள் **${serviceName}** சேவையை பரிந்துரைக்கிறேன். ${reason}.`;
        if (recommendations.length > 1) {
            const otherServices = recommendations.slice(1, 3).map(r => {
                const data = translations[r.id as keyof typeof translations];
                return data?.name[lang] || r.serviceName;
            });
            message += ` நீங்கள் ${otherServices.join(" அல்லது ")} சேவைகளையும் பரிசீலிக்கலாம்.`;
        }
        message += " புக்கிங் பக்கத்தை திறக்கவா?";
    }
    else if (lang === "hi-IN") {
        message = `आपके प्रश्न के आधार पर, मैं हमारी **${serviceName}** सेवा की सिफारिश करता हूं for. ${reason}.`;
        if (recommendations.length > 1) {
            const otherServices = recommendations.slice(1, 3).map(r => {
                const data = translations[r.id as keyof typeof translations];
                return data?.name[lang] || r.serviceName;
            });
            message += ` आप ${otherServices.join(" या ")} पर भी विचार कर सकते हैं।`;
        }
        message += " क्या मैं बुकिंग पेज खोलूं?";
    }
    else {
        // English Default
        message = `Based on your query, I recommend our **${serviceName}** service. ${reason}.`;
        if (recommendations.length > 1) {
            const otherServices = recommendations.slice(1, 3).map(r => {
                const data = translations[r.id as keyof typeof translations];
                return data?.name[lang] || r.serviceName;
            });
            message += ` You might also consider ${otherServices.join(" or ")}.`;
        }
        message += " Would you like me to open the booking page?";
    }

    return message;
}

/**
 * Check if query is asking about a problem/issue
 */
export function isProblemQuery(query: string): boolean {
    const problemKeywords = [
        "problem", "issue", "damaged", "broken", "not working",
        "dirty", "stain", "smell", "odor", "scratch", "faded",
        "dull", "cloudy", "foggy", "yellow", "crack", "leak",
        "water spot", "swirl", "oxidation", "rust",
        // Tamil
        "பிரச்சினை", "சேதம்", "உடைந்தது", "வேலை செய்யவில்லை",
        "அழுக்கு", "கறைகள்", "நாற்றம்", "கீறல்", "மங்கிய",
        // Hindi
        "समस्या", "मुद्दा", "क्षतिग्रस्त", "टूटा हुआ", "काम नहीं कर रहा",
        "गंदा", "दाग", "बदबू", "खरोंच", "फीका"
    ];

    return problemKeywords.some(keyword =>
        query.toLowerCase().includes(keyword.toLowerCase())
    );
}

/**
 * Extract problem description from query (English only mostly/regex is simpler)
 */
export function extractProblemDescription(query: string): string | null {
    // Common problem patterns - mostly English supported for now, 
    // extending to other languages requires complex NLP or simply returning exact match
    const patterns = [
        /(?:my|the)\s+([\w\s]+)\s+(?:is|are|has|have|looks?)\s+([\w\s]+)/i,
        /(?:i have|there is|there are)\s+a?\s*([\w\s]+)/i
    ];

    for (const pattern of patterns) {
        const match = query.match(pattern);
        if (match) {
            return match[0];
        }
    }

    return null;
}
