/**
 * Database service for location responses
 * Provides CRUD operations for the location_responses table
 */

import { db } from "../db.js";
import { locationResponses } from "../../shared/schema.js";
import { eq, like, or } from "drizzle-orm";
import type { InsertLocationResponse, LocationResponse } from "../../shared/schema.js";

// Get all location responses
export async function getAllLocations(): Promise<LocationResponse[]> {
  return await db.select().from(locationResponses);
}

// Get location by name
export async function getLocationByName(name: string): Promise<LocationResponse | null> {
  const results = await db
    .select()
    .from(locationResponses)
    .where(eq(locationResponses.name, name));
  return results[0] || null;
}

// Get locations by type
export async function getLocationsByType(type: string): Promise<LocationResponse[]> {
  return await db
    .select()
    .from(locationResponses)
    .where(eq(locationResponses.type, type));
}

// Get locations by building
export async function getLocationsByBuilding(building: string): Promise<LocationResponse[]> {
  return await db
    .select()
    .from(locationResponses)
    .where(eq(locationResponses.building, building));
}

// Search locations by name or building
export async function searchLocations(query: string): Promise<LocationResponse[]> {
  return await db
    .select()
    .from(locationResponses)
    .where(
      or(
        like(locationResponses.name, `%${query}%`),
        like(locationResponses.building, `%${query}%`),
        like(locationResponses.type, `%${query}%`)
      )
    );
}

// Create new location
export async function createLocation(data: InsertLocationResponse): Promise<LocationResponse> {
  const results = await db
    .insert(locationResponses)
    .values(data as any)  // Cast to bypass drizzle-zod type inference issue
    .returning();
  return results[0];
}

// Update location by name
export async function updateLocation(
  name: string,
  data: Partial<InsertLocationResponse>
): Promise<LocationResponse | null> {
  const results = await db
    .update(locationResponses)
    .set({
      ...data,
      updatedAt: new Date(),
    } as any)  // Cast to bypass drizzle-zod type inference issue
    .where(eq(locationResponses.name, name))
    .returning();
  return results[0] || null;
}

// Upsert location (insert if not exists, update if exists)
export async function upsertLocation(
  data: InsertLocationResponse
): Promise<LocationResponse> {
  const existing = await getLocationByName(data.name);
  
  if (existing) {
    // Update
    const results = await db
      .update(locationResponses)
      .set({
        ...data,
        updatedAt: new Date(),
      } as any)  // Cast to bypass drizzle-zod type inference issue
      .where(eq(locationResponses.name, data.name))
      .returning();
    return results[0];
  } else {
    // Insert
    const results = await db
      .insert(locationResponses)
      .values(data as any)  // Cast to bypass drizzle-zod type inference issue
      .returning();
    return results[0];
  }
}

// Delete location by name
export async function deleteLocation(name: string): Promise<boolean> {
  const results = await db
    .delete(locationResponses)
    .where(eq(locationResponses.name, name))
    .returning();
  return results.length > 0;
}

// Get location with language-specific response
export async function getLocationWithLanguage(
  name: string,
  language: "en" | "ceb" = "en"
): Promise<{ responses: string[]; coordinates: number[]; pins: any[]; building: string; floor: string } | null> {
  const location = await getLocationByName(name);
  if (!location) return null;

  const responses = language === "ceb" && location.responsesCeb && location.responsesCeb.length > 0
    ? location.responsesCeb
    : (location.responsesEn || []);

  return {
    responses: responses || [],
    coordinates: location.coordinates,
    pins: location.pins || [],
    building: location.building,
    floor: location.floor || "N/A",
  };
}

// Get normalized location name (handles aliases)
export async function findLocationByAlias(alias: string): Promise<LocationResponse | null> {
  // Try exact match first
  const exact = await getLocationByName(alias);
  if (exact) return exact;

  // Try case-insensitive search
  const results = await db
    .select()
    .from(locationResponses)
    .where(like(locationResponses.name, alias));
  
  return results[0] || null;
}

// Export for use in admin panel
export { locationResponses };
