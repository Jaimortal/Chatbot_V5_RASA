import fs from "fs";
import path from "path";

const responsesPath = path.join(process.cwd(), "rasa", "responses.json");

export function loadResponses() {
  const raw = fs.readFileSync(responsesPath, "utf-8");
  return JSON.parse(raw);
}

export function findIntent(intent: string) {
  const data = loadResponses();
  return data.find((item: any) => item.intent === intent);
}
