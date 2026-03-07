
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

async function checkQuota() {
    console.log("Checking Gemini API Quota...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    try {
        const result = await model.generateContent("Ping");
        console.log("Status: ONLINE");
        console.log("Response:", result.response.text());
    } catch (e) {
        if (e.message.includes("429")) {
            console.log("Status: QUOTA EXCEEDED (429)");
            console.log("Details:", e.message);
        } else {
            console.log("Error:", e.message);
        }
    }
}

checkQuota();
