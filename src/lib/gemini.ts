// Centralized AI Helper: Supports Gemini (Fallback) and Groq (Primary)
let lastRequestTime = 0;
const MIN_REQUEST_GAP = 1000; // Groq is faster, 1s gap is usually fine

export async function chatWithAI(messages: any[], systemPrompt: string) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_GAP) {
    const waitTime = MIN_REQUEST_GAP - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();

  const groqKey = process.env.GROQ_API_KEY;

  if (groqKey) {
    try {
      console.log("Using Groq AI (Llama 3)...");
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map(m => ({
              role: m.role,
              content: m.content
            }))
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      } else {
        const err = await response.json();
        console.warn("Groq API failed, falling back to Gemini:", err);
      }
    } catch (e) {
      console.error("Groq attempt failed:", e);
    }
  }

  // FALLBACK TO GEMINI
  console.log("Falling back to Gemini AI...");
  const geminiKey = process.env.GEMINI_API_KEY;
  const model = "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

  const history = messages.slice(0, -1).map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const contents = [
    ...history,
    {
      role: "user",
      parts: [{ text: messages[messages.length - 1].content }],
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`AI error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Keep chatWithGemini for backward compatibility
export const chatWithGemini = chatWithAI;
