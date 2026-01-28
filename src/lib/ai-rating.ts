
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface SentimentResult {
  score: number; // -1 to 1
  label: "Positive" | "Neutral" | "Negative";
  themes: string[];
  intensity: number; // 0 to 1
  is_abusive: boolean;
  is_low_effort: boolean;
}

export async function analyzeReviewSentiment(comment: string): Promise<SentimentResult> {
  if (!comment || comment.length < 10) {
    return {
      score: 0,
      label: "Neutral",
      themes: [],
      intensity: 0.5,
      is_abusive: false,
      is_low_effort: true,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `
      Analyze the following customer review for a car detailing service.
      Extract:
      1. Overall sentiment score (-1.0 to 1.0)
      2. Sentiment label (Positive, Neutral, Negative)
      3. Key themes (quality, time, price, staff, cleanliness, communication)
      4. Intensity score (0.0 to 1.0)
      5. Boolean flags for: is_abusive, is_low_effort (e.g., "good", "nice", "ok")

      Review: "${comment}"

      Respond ONLY with a JSON object in this format:
      {
        "score": number,
        "label": string,
        "themes": string[],
        "intensity": number,
        "is_abusive": boolean,
        "is_low_effort": boolean
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Sentiment analysis failed:", error);
    return {
      score: 0,
      label: "Neutral",
      themes: [],
      intensity: 0.5,
      is_abusive: false,
      is_low_effort: false,
    };
  }
}

export interface RatingInput {
  stars: number;
  sentiment: SentimentResult;
  is_repeat_customer: boolean;
  is_verified: boolean;
  days_ago: number;
}

export function calculateWeightedRating(inputs: RatingInput[]): {
  finalRating: number;
  confidence: "High" | "Medium" | "Low";
  totalReviews: number;
} {
  if (inputs.length === 0) return { finalRating: 0, confidence: "Low", totalReviews: 0 };

  let totalWeight = 0;
  let weightedSum = 0;

  inputs.forEach((input) => {
    // 1. Recency Weight (decay over 365 days)
    const recencyWeight = Math.max(0.1, 1 - input.days_ago / 365);
    
    // 2. Trust Weight
    let trustWeight = 1.0;
    if (input.is_repeat_customer) trustWeight *= 1.5;
    if (!input.is_verified) trustWeight *= 0.5;
    if (input.sentiment.is_low_effort) trustWeight *= 0.7;
    if (input.sentiment.is_abusive) trustWeight = 0.01; // Almost ignore

    // 3. Sentiment Adjustment
    // If stars are high but sentiment is negative, pull down. 
    // If stars are low but sentiment is positive, pull up slightly.
    const sentimentAdjustment = input.sentiment.score * 0.5;
    const adjustedStars = Math.max(1, Math.min(5, input.stars + sentimentAdjustment));

    const combinedWeight = recencyWeight * trustWeight;
    
    weightedSum += adjustedStars * combinedWeight;
    totalWeight += combinedWeight;
  });

  const finalRating = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  // Confidence calculation
  let confidence: "High" | "Medium" | "Low" = "Low";
  if (inputs.length > 50 && totalWeight > 20) confidence = "High";
  else if (inputs.length > 10) confidence = "Medium";

  return {
    finalRating: Math.round(finalRating * 10) / 10,
    confidence,
    totalReviews: inputs.length
  };
}
