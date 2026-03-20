/**
 * Database service for bot responses
 * Provides CRUD operations for the bot_responses table
 */

import { db } from "../db.js";
import { botResponses } from "../../shared/schema.js";
import { eq, like, and, or } from "drizzle-orm";
import type { InsertBotResponse, BotResponse } from "../../shared/schema.js";

// Get all bot responses
export async function getAllResponses(): Promise<BotResponse[]> {
  return await db.select().from(botResponses);
}

// Get response by intent
export async function getResponseByIntent(intent: string): Promise<BotResponse | null> {
  const results = await db
    .select()
    .from(botResponses)
    .where(eq(botResponses.intent, intent));
  return results[0] || null;
}

// Get responses by category
export async function getResponsesByCategory(category: string): Promise<BotResponse[]> {
  return await db
    .select()
    .from(botResponses)
    .where(eq(botResponses.category, category));
}

// Search responses by intent pattern
export async function searchResponses(query: string): Promise<BotResponse[]> {
  return await db
    .select()
    .from(botResponses)
    .where(
      or(
        like(botResponses.intent, `%${query}%`),
        like(botResponses.category, `%${query}%`),
        like(botResponses.subCategory, `%${query}%`)
      )
    );
}

// Create new response
export async function createResponse(data: InsertBotResponse): Promise<BotResponse> {
  const results = await db
    .insert(botResponses)
    .values(data as any)  // Cast to bypass drizzle-zod type inference issue
    .returning();
  return results[0];
}

// Update response by intent
export async function updateResponse(
  intent: string,
  data: Partial<InsertBotResponse>
): Promise<BotResponse | null> {
  const results = await db
    .update(botResponses)
    .set({
      ...data,
      updatedAt: new Date(),
    } as any)  // Cast to bypass drizzle-zod type inference issue
    .where(eq(botResponses.intent, intent))
    .returning();
  return results[0] || null;
}

// Upsert response (insert if not exists, update if exists)
export async function upsertResponse(
  data: InsertBotResponse
): Promise<BotResponse> {
  const existing = await getResponseByIntent(data.intent);
  
  if (existing) {
    // Update
    const results = await db
      .update(botResponses)
      .set({
        ...data,
        updatedAt: new Date(),
      } as any)  // Cast to bypass drizzle-zod type inference issue
      .where(eq(botResponses.intent, data.intent))
      .returning();
    return results[0];
  } else {
    // Insert
    const results = await db
      .insert(botResponses)
      .values(data as any)  // Cast to bypass drizzle-zod type inference issue
      .returning();
    return results[0];
  }
}

// Delete response by intent
export async function deleteResponse(intent: string): Promise<boolean> {
  const results = await db
    .delete(botResponses)
    .where(eq(botResponses.intent, intent))
    .returning();
  return results.length > 0;
}

// Get response with language-specific answer
export async function getResponseWithLanguage(
  intent: string,
  language: "en" | "ceb" = "en"
): Promise<{ text: string; followUp: string[]; mapData?: any; imageUrl?: string } | null> {
  const response = await getResponseByIntent(intent);
  if (!response) return null;

  let text = "";
  
  // Try requested language first
  if (language === "ceb" && response.answerCeb && response.answerCeb.length > 0) {
    text = response.answerCeb.join("\n");
  } else if (response.answerEn && response.answerEn.length > 0) {
    text = response.answerEn.join("\n");
  } else if (response.answer && response.answer.length > 0) {
    text = response.answer.join("\n");
  }

  return {
    text,
    followUp: response.followUp || [],
    mapData: response.mapData,
    imageUrl: response.imageUrl || undefined,
  };
}

// Export for use in admin panel
export { botResponses };
