/**
 * Migration service for admin panel
 * Provides functions to migrate JSON data to PostgreSQL
 */

import { db } from "../db.js";
import { botResponses, locationResponses } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

// Production-ready path resolution
// Tries multiple strategies to find the JSON files
function resolveJsonPath(relativePath: string): string | null {
  // Strategy 1: Use environment variable if set
  if (process.env.RASA_ACTIONS_PATH) {
    const envPath = path.join(process.env.RASA_ACTIONS_PATH, relativePath);
    if (fs.existsSync(envPath)) return envPath;
  }

  // Strategy 2: Use process.cwd() (where the server was started)
  const cwdPath = path.join(process.cwd(), "rasa/actions", relativePath);
  if (fs.existsSync(cwdPath)) return cwdPath;

  // Strategy 3: Try common production paths
  const possiblePaths = [
    // Standard production deployments
    path.join(process.cwd(), "rasa/actions", relativePath),
    // Docker/container paths
    path.join("/app", "rasa/actions", relativePath),
    // Relative to dist/server/db (compiled output)
    path.join(__dirname, "../../rasa/actions", relativePath),
    // Relative to project root
    path.join(__dirname, "../../../rasa/actions", relativePath),
    // One more level up
    path.join(__dirname, "../../../../rasa/actions", relativePath),
  ];

  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) return testPath;
  }

  // Return the process.cwd() path as default (most production-ready)
  return cwdPath;
}

// Resolve paths dynamically
const RESPONSES_JSON_PATH = resolveJsonPath("responses.json");
const LOCATIONS_JSON_PATH = resolveJsonPath("responses_location.json");

export interface MigrationResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
}

/**
 * Migrate bot responses from responses.json to PostgreSQL
 */
export async function migrateResponsesFromJSON(): Promise<MigrationResult> {
  const errors: string[] = [];
  let imported = 0;

  try {
    // Check if file path was resolved
    if (!RESPONSES_JSON_PATH) {
      return {
        success: false,
        message: "Could not resolve path to responses.json",
        imported: 0,
        errors: ["Path resolution failed - ensure rasa/actions/responses.json exists"],
      };
    }

    // Check if file exists
    if (!fs.existsSync(RESPONSES_JSON_PATH)) {
      return {
        success: false,
        message: "responses.json not found in rasa/actions/",
        imported: 0,
        errors: ["File not found: rasa/actions/responses.json"],
      };
    }

    // Read and parse JSON
    const rawData = fs.readFileSync(RESPONSES_JSON_PATH, "utf-8");
    const responses = JSON.parse(rawData);

    if (!Array.isArray(responses)) {
      return {
        success: false,
        message: "Invalid JSON format: expected array",
        imported: 0,
        errors: ["Invalid format"],
      };
    }

    // Process each response
    for (const item of responses) {
      try {
        const answer = item.responses?.answer;
        let answerEn: string[] | null = null;
        let answerCeb: string[] | null = null;
        let simpleAnswer: string[] | null = null;

        // Handle multilingual or simple format
        if (Array.isArray(answer)) {
          simpleAnswer = answer;
        } else if (answer && typeof answer === "object") {
          answerEn = answer.en || null;
          answerCeb = answer.ceb || null;
        }

        const mapData = item.responses?.mapData || null;

        // Upsert to database
        await db
          .insert(botResponses)
          .values({
            intent: item.intent,
            category: item.category || "",
            subCategory: item.sub_category || "",
            answerEn,
            answerCeb,
            answer: simpleAnswer,
            followUp: item.responses?.follow_up || [],
            contextSlots: item.responses?.context_slots || {},
            imageUrl: item.responses?.imageUrl || "",
            imageUrls: item.responses?.imageUrls || [],
            mapData: mapData,
            metadata: item.metadata || {},
          } as any)
          .onConflictDoUpdate({
            target: botResponses.intent,
            set: {
              category: item.category || "",
              subCategory: item.sub_category || "",
              answerEn,
              answerCeb,
              answer: simpleAnswer,
              followUp: item.responses?.follow_up || [],
              contextSlots: item.responses?.context_slots || {},
              imageUrl: item.responses?.imageUrl || "",
              imageUrls: item.responses?.imageUrls || [],
              mapData: mapData,
              metadata: item.metadata || {},
              updatedAt: new Date(),
            },
          });

        imported++;
      } catch (err) {
        errors.push(`Failed to import ${item.intent}: ${(err as Error).message}`);
      }
    }

    return {
      success: errors.length === 0,
      message: `Successfully migrated ${imported} responses${errors.length > 0 ? ` with ${errors.length} errors` : ""}`,
      imported,
      errors,
    };
  } catch (err) {
    return {
      success: false,
      message: `Migration failed: ${(err as Error).message}`,
      imported,
      errors: [...errors, (err as Error).message],
    };
  }
}

/**
 * Migrate locations from responses_location.json to PostgreSQL
 */
export async function migrateLocationsFromJSON(): Promise<MigrationResult> {
  const errors: string[] = [];
  let imported = 0;

  try {
    // Check if file path was resolved
    if (!LOCATIONS_JSON_PATH) {
      return {
        success: false,
        message: "Could not resolve path to responses_location.json",
        imported: 0,
        errors: ["Path resolution failed - ensure rasa/actions/responses_location.json exists"],
      };
    }

    // Check if file exists
    if (!fs.existsSync(LOCATIONS_JSON_PATH)) {
      return {
        success: false,
        message: "responses_location.json not found in rasa/actions/",
        imported: 0,
        errors: ["File not found: rasa/actions/responses_location.json"],
      };
    }

    // Read and parse JSON
    const rawData = fs.readFileSync(LOCATIONS_JSON_PATH, "utf-8");
    const data = JSON.parse(rawData);
    const locations = data.locations;

    if (!locations || typeof locations !== "object") {
      return {
        success: false,
        message: "Invalid JSON format: expected locations object",
        imported: 0,
        errors: ["Invalid format"],
      };
    }

    // Process each location
    for (const [name, locData] of Object.entries(locations)) {
      try {
        const location = locData as any;

        // Debug: Log the data being imported
        console.log(`Importing location: ${name}`, {
          type: location.type,
          building: location.building,
          floor: location.floor,
          coordinates: location.coordinates,
          map_id: location.map_id,
        });

        const insertData = {
          name: name,
          type: location.type || "",
          building: location.building || "",
          floor: location.floor || "N/A",
          coordinates: location.coordinates || [0, 0],
          mapId: location.map_id || "main_map",
          responsesEn: location.responses?.en || [],
          responsesCeb: location.responses?.ceb || [],
          pins: location.pins || [],
          imageUrls: location.imageUrls || [],
        };

        // Delete existing record first (to avoid unique constraint issues)
        await db.delete(locationResponses).where(eq(locationResponses.name, name));

        // Insert new record
        await db.insert(locationResponses).values(insertData as any);

        imported++;
      } catch (err) {
        const errorMsg = `Failed to import ${name}: ${(err as Error).message}`;
        console.error(errorMsg, err); // Log full error details
        errors.push(errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      message: `Successfully migrated ${imported} locations${errors.length > 0 ? ` with ${errors.length} errors` : ""}`,
      imported,
      errors,
    };
  } catch (err) {
    return {
      success: false,
      message: `Migration failed: ${(err as Error).message}`,
      imported,
      errors: [...errors, (err as Error).message],
    };
  }
}

/**
 * Get migration status - counts of current data in database
 */
export async function getMigrationStatus(): Promise<{
  responsesCount: number;
  locationsCount: number;
}> {
  const responses = await db.select({ count: botResponses.id }).from(botResponses);
  const locations = await db.select({ count: locationResponses.id }).from(locationResponses);

  return {
    responsesCount: responses.length,
    locationsCount: locations.length,
  };
}
