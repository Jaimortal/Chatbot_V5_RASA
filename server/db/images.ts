import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { images, type InsertImage, type Image } from "../../shared/schema.js";

// Save image to database
export async function saveImage(data: InsertImage): Promise<Image | null> {
  try {
    const result = await db.insert(images).values(data).returning();
    return result[0] || null;
  } catch (error) {
    console.error("Error saving image:", error);
    return null;
  }
}

// Get image by ID
export async function getImageById(id: string): Promise<Image | null> {
  try {
    const result = await db.select().from(images).where(eq(images.id, id));
    return result[0] || null;
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
}

// Get all images
export async function getAllImages(): Promise<Image[]> {
  try {
    return await db.select().from(images).orderBy(images.createdAt);
  } catch (error) {
    console.error("Error fetching images:", error);
    return [];
  }
}

// Delete image by ID
export async function deleteImage(id: string): Promise<boolean> {
  try {
    await db.delete(images).where(eq(images.id, id));
    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
}
