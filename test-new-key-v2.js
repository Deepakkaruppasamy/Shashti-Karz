
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

function loadEnv() {
    const content = fs.readFileSync('.env.local', 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            env[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
    return env;
}

const env = loadEnv();
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

async function testNewKey() {
    console.log("Testing New Gemini API Key...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    try {
        const result = await model.generateContent("Hello, are you working?");
        console.log("Status: SUCCESS!");
        console.log("AI Response:", result.response.text());
    } catch (e) {
        console.error("Status: FAILED");
        console.error("Error Details:", e.message);
    }
}

testNewKey();
