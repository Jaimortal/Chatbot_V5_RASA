import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query } from "../server/db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const responsesPath = path.join(__dirname, "..", "rasa", "actions", "responses.json");
  console.log("Reading responses.json from", responsesPath);

  const raw = fs.readFileSync(responsesPath, "utf-8");
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    console.error("responses.json is not an array; cannot migrate safely.");
    process.exit(1);
  }

  const exam = data.find((item: any) => item?.intent === "exam_requirements");
  if (!exam) {
    console.error("Could not find intent 'exam_requirements' in responses.json");
    process.exit(1);
  }

  console.log("Found exam_requirements intent, preparing to migrate to PostgreSQL...");

  // Ensure table exists
  await query(`
    CREATE TABLE IF NOT EXISTS responses (
      id SERIAL PRIMARY KEY,
      intent TEXT UNIQUE NOT NULL,
      category TEXT,
      sub_category TEXT,
      responses JSONB,
      laboratories JSONB,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Upsert record
  await query(
    `INSERT INTO responses (intent, category, sub_category, responses, laboratories, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (intent) DO UPDATE SET
       category = EXCLUDED.category,
       sub_category = EXCLUDED.sub_category,
       responses = EXCLUDED.responses,
       laboratories = EXCLUDED.laboratories,
       metadata = EXCLUDED.metadata,
       updated_at = NOW();`,
    [
      exam.intent,
      exam.category ?? null,
      exam.sub_category ?? null,
      exam.responses ?? null,
      exam.laboratories ?? null,
      exam.metadata ?? null,
    ]
  );

  console.log("Successfully migrated 'exam_requirements' intent to PostgreSQL.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
