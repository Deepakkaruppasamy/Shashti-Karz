// Rate limit guard: prevents sending more than one request every 4 seconds to save quota
let lastRequestTime = 0;
const MIN_REQUEST_GAP = 4000; // 4 seconds

export async function chatWithGemini(messages: any[], systemPrompt: string) {
  // Ensure we don't burst the API and hit the 429 quota limit
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_GAP) {
    const waitTime = MIN_REQUEST_GAP - timeSinceLastRequest;
    console.log(`Rate limit guard: Waiting ${waitTime}ms before calling Gemini API...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();

  const apiKey = process.env.GEMINI_API_KEY;
  // Using 1.5-flash for better stability on free-tier quotas
  const model = "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const history = messages.slice(0, -1).map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1].content;

  const contents = [
    ...history,
    {
      role: "user",
      parts: [{ text: lastMessage }],
    },
  ];

  const body = {
    contents,
    system_instruction: {
      parts: { text: systemPrompt },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 429) {
      throw new Error("Gemini API quota exceeded. Please check your billing or quota limits.");
    }
    throw new Error(`Gemini API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();

  if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
    console.error("Unexpected Gemini response structure:", JSON.stringify(data));
    throw new Error("Invalid response from Gemini API");
  }

  return data.candidates[0].content.parts[0].text;
}
