import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { botResponses, locationResponses } from "../shared/schema";
import { count } from "drizzle-orm";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/chatbot",
});

const db = drizzle(pool);

async function verify() {
  console.log("Checking database...");
  
  try {
    // Check if tables exist by counting rows
    const botCount = await db.select({ count: count() }).from(botResponses);
    console.log(`bot_responses table: ${botCount[0].count} rows`);
    
    const locCount = await db.select({ count: count() }).from(locationResponses);
    console.log(`location_responses table: ${locCount[0].count} rows`);
    
    if (botCount[0].count === 0) {
      console.log("No data in bot_responses. Migration may not have run.");
    } else {
      console.log("Migration successful!");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

verify();
