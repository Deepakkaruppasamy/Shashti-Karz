/**
 * Deep AI Service Recommendations for Dinesh
 * Analyzes user queries and suggests relevant services
 */

export interface ServiceRecommendation {
    serviceName: string;
    reason: string;
    priority: "high" | "medium" | "low";
    keywords: string[];
}

/**
 * Service recommendation rules based on query analysis
 */
const recommendationRules: ServiceRecommendation[] = [
    // Paint-related issues
    {
        serviceName: "Ceramic Coating",
        reason: "Provides long-lasting protection against scratches, UV rays, and water spots",
        priority: "high",
        keywords: ["scratch", "protect", "shine", "gloss", "water spot", "swirl", "dull paint", "faded", "oxidation"]
    },
    {
        serviceName: "Paint Protection Film (PPF)",
        reason: "Best protection against rock chips, scratches, and environmental damage",
        priority: "high",
        keywords: ["rock chip", "stone chip", "scratch protection", "new car", "luxury", "premium", "high-end"]
    },
    {
        serviceName: "Paint Polishing",
        reason: "Removes minor scratches, swirl marks, and restores shine",
        priority: "medium",
        keywords: ["swirl marks", "minor scratch", "dull paint", "restore shine", "polish"]
    },

    // Water and cleanliness issues
    {
        serviceName: "Ceramic Coating",
        reason: "Creates a hydrophobic surface for easy water beading and self-cleaning effect",
        priority: "high",
        keywords: ["water spot", "hard water", "rain marks", "water bead", "easy clean", "hydrophobic"]
    },
    {
        serviceName: "Full Detailing",
        reason: "Complete deep cleaning and restoration of your vehicle",
        priority: "medium",
        keywords: ["dirty", "very dirty", "deep clean", "complete clean", "full service", "make it new"]
    },

    // Interior issues
    {
        serviceName: "Interior Deep Cleaning",
        reason: "Professional cleaning for stains, odors, and complete cabin restoration",
        priority: "high",
        keywords: ["smell", "odor", "stain", "dirty seat", "dashboard", "interior", "cabin", "upholstery"]
    },
    {
        serviceName: "Odor Removal & AC Sanitization",
        reason: "Eliminates bad smells and sanitizes air conditioning system",
        priority: "high",
        keywords: ["smell", "bad smell", "odor", "smoke smell", "pet smell", "musty", "ac smell", "ventilation"]
    },
    {
        serviceName: "Leather Conditioning",
        reason: "Preserves and protects leather seats from cracking and fading",
        priority: "medium",
        keywords: ["leather", "seat crack", "leather care", "leather protect"]
    },

    // Lighting issues
    {
        serviceName: "Headlight Restoration",
        reason: "Removes yellowing and cloudiness, improves visibility and appearance",
        priority: "high",
        keywords: ["headlight", "foggy", "yellow", "cloudy", "hazy", "dim light", "poor visibility"]
    },

    // Wheels and tires
    {
        serviceName: "Wheel & Tire Detailing",
        reason: "Deep cleaning and dressing for showroom-look wheels",
        priority: "medium",
        keywords: ["wheel", "tire", "rim", "brake dust", "dirty wheel"]
    },

    // Engine
    {
        serviceName: "Engine Bay Detailing",
        reason: "Professional engine cleaning for better maintenance and appearance",
        priority: "low",
        keywords: ["engine", "engine bay", "greasy engine", "dirty engine", "engine clean"]
    },

    // Regular maintenance
    {
        serviceName: "Exterior Wash & Wax",
        reason: "Regular maintenance wash with protective wax layer",
        priority: "medium",
        keywords: ["wash", "regular wash", "maintenance", "basic", "quick clean", "weekly"]
    },

    // Weather protection
    {
        serviceName: "Ceramic Coating",
        reason: "Superior protection against harsh weather, sun, and rain",
        priority: "high",
        keywords: ["sun damage", "uv", "rain damage", "weather", "outdoor parking", "harsh climate"]
    },

    // New car
    {
        serviceName: "New Car Protection Package",
        reason: "Complete protection for your new vehicle from day one",
        priority: "high",
        keywords: ["new car", "just bought", "brand new", "protect new car"]
    },

    // Luxury vehicles
    {
        serviceName: "Premium Detailing Package",
        reason: "Specialized care for luxury and high-end vehicles",
        priority: "high",
        keywords: ["luxury", "premium", "expensive car", "bmw", "mercedes", "audi", "high-end"]
    }
];

/**
 * Analyze query and recommend services
 */
export function getServiceRecommendations(query: string): ServiceRecommendation[] {
    const lowerQuery = query.toLowerCase();
    const recommendations: ServiceRecommendation[] = [];

    recommendationRules.forEach(rule => {
        const matches = rule.keywords.filter(keyword =>
            lowerQuery.includes(keyword.toLowerCase())
        );

        if (matches.length > 0) {
            // Add recommendation if not already added
            if (!recommendations.find(r => r.serviceName === rule.serviceName)) {
                recommendations.push({
                    ...rule,
                    keywords: matches // Include only matched keywords
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
 * Generate a natural response with service recommendation
 */
export function generateRecommendationResponse(
    query: string,
    recommendations: ServiceRecommendation[]
): string {
    if (recommendations.length === 0) {
        return "";
    }

    const topRecommendation = recommendations[0];

    // Build recommendation message
    let message = `Based on your query, I recommend our **${topRecommendation.serviceName}** service. ${topRecommendation.reason}.`;

    // Add additional recommendations if available
    if (recommendations.length > 1) {
        const otherServices = recommendations.slice(1, 3).map(r => r.serviceName);
        message += ` You might also consider ${otherServices.join(" or ")}.`;
    }

    message += " Would you like me to open the booking page?";

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
        "water spot", "swirl", "oxidation", "rust"
    ];

    return problemKeywords.some(keyword =>
        query.toLowerCase().includes(keyword)
    );
}

/**
 * Extract problem description from query
 */
export function extractProblemDescription(query: string): string | null {
    // Common problem patterns
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
