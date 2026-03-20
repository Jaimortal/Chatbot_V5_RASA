/**
 * Admin API routes for migrating JSON data to PostgreSQL
 */

import { Router } from "express";
import { migrateResponsesFromJSON, migrateLocationsFromJSON, getMigrationStatus } from "../db/migration.js";

const router = Router();

/**
 * POST /api/admin/migrate/responses
 * Migrate responses.json to PostgreSQL
 */
router.post("/migrate/responses", async (_req, res) => {
  try {
    const result = await migrateResponsesFromJSON();
    res.json({
      success: result.success,
      message: result.message,
      imported: result.imported,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Error migrating responses:", error);
    res.status(500).json({
      success: false,
      message: "Migration failed",
      imported: 0,
      errors: [(error as Error).message],
    });
  }
});

/**
 * POST /api/admin/migrate/locations
 * Migrate responses_location.json to PostgreSQL
 */
router.post("/migrate/locations", async (_req, res) => {
  try {
    const result = await migrateLocationsFromJSON();
    res.json({
      success: result.success,
      message: result.message,
      imported: result.imported,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Error migrating locations:", error);
    res.status(500).json({
      success: false,
      message: "Migration failed",
      imported: 0,
      errors: [(error as Error).message],
    });
  }
});

/**
 * GET /api/admin/migrate/status
 * Get current migration status (counts of data in database)
 */
router.get("/migrate/status", async (_req, res) => {
  try {
    const status = await getMigrationStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Error getting migration status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get migration status",
    });
  }
});

export default router;
