import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { faqConfigs, type FaqConfig, type InsertFaqConfig } from "../../shared/schema.js";

// Get all FAQs
export async function getAllFaqs(): Promise<FaqConfig[]> {
  try {
    return await db.select().from(faqConfigs).orderBy(faqConfigs.sortOrder);
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return [];
  }
}

// Get only enabled FAQs
export async function getActiveFaqs(): Promise<FaqConfig[]> {
  try {
    return await db.select().from(faqConfigs).where(eq(faqConfigs.enabled, true)).orderBy(faqConfigs.sortOrder);
  } catch (error) {
    console.error("Error fetching active FAQs:", error);
    return [];
  }
}

// Create or update FAQ
export async function upsertFaq(data: InsertFaqConfig & { id?: string }): Promise<FaqConfig | null> {
  try {
    if (data.id) {
      const result = await db.update(faqConfigs)
        .set(data)
        .where(eq(faqConfigs.id, data.id))
        .returning();
      return result[0] || null;
    } else {
      const result = await db.insert(faqConfigs)
        .values(data)
        .returning();
      return result[0] || null;
    }
  } catch (error) {
    console.error("Error upserting FAQ:", error);
    return null;
  }
}

// Delete FAQ
export async function deleteFaq(id: string): Promise<boolean> {
  try {
    await db.delete(faqConfigs).where(eq(faqConfigs.id, id));
    return true;
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return false;
  }
}
