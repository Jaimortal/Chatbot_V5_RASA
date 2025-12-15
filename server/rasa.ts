import fs from "fs";
import path from "path";

const responsesPath = path.join(process.cwd(), "rasa", "actions", "responses.json");

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
