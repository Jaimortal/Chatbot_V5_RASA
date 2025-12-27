import fs from "fs";
import path from "path";

const responsesPath = path.join(process.cwd(), "rasa", "actions", "responses.json");
const RASA_API_URL = "http://127.0.0.1:5005/webhooks/rest/webhook";

let cachedResponses: any[] = [];
let lastModified = 0;

export function loadResponses() {
  try {
    const stats = fs.statSync(responsesPath);
    
    // Only reload if file has been modified
    if (stats.mtime.getTime() === lastModified && cachedResponses.length > 0) {
      return cachedResponses;
    }
    
    const raw = fs.readFileSync(responsesPath, "utf-8");
    cachedResponses = JSON.parse(raw);
    lastModified = stats.mtime.getTime();
    console.log(`[Rasa] Reloaded responses.json - ${cachedResponses.length} responses loaded`);
    return cachedResponses;
  } catch (error) {
    console.error("Error loading responses:", error);
    return cachedResponses.length > 0 ? cachedResponses : [];
  }
}

export function findIntent(intent: string) {
  const data = loadResponses();
  return data.find((item: any) => item.intent === intent);
}

// Call actual Rasa API
export async function callRasaAPI(message: string, language?: string, sessionId?: string) {
  try {
    console.log(`[Rasa] Calling Rasa API: "${message}"`);
    
    const response = await fetch(RASA_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "user", message, language, sessionId }),
    });

    if (!response.ok) {
      throw new Error(`Rasa API returned status ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Rasa] Rasa response:`, data);
    return data;
  } catch (error) {
    console.error("[Rasa] Error calling Rasa API:", error);
    // Fallback to local responses
    console.log("[Rasa] Falling back to local responses");
    const localResult = findIntent(message);
    if (localResult) {
      const answer = Array.isArray(localResult.responses.answer) 
        ? localResult.responses.answer.join("\n")
        : localResult.responses.answer || "I found a local response.";
      
      return [{
        text: answer,
        custom: {
          ...localResult.responses,
          mapData: localResult.responses.mapData // Keep original coordinate format
        }
      }];
    }
    return [{ text: "Sorry, I'm having trouble connecting to the AI service." }];
  }
}
