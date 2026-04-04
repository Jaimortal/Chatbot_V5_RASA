import { Router } from "express";
import { db } from "../db.js";
import { migrationTracking } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import { 
  migrateResponsesFromJSON, 
  migrateLocationsFromJSON, 
  migrateSuperIntentsFromJSON,
  syncKnowledgeBase,
  getMigrationStatus 
} from "../db/migration.js";

const router = Router();

/**
 * POST /api/admin/migrate/sync
 */
router.post("/sync", async (req, res) => {
  try {
    const force = req.query.force === "true";
    const result = await syncKnowledgeBase(force);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "Sync failed", errors: [(error as Error).message] });
  }
});

/**
 * POST /api/admin/migrate/responses
 */
router.post("/responses", async (req, res) => {
  try {
    const force = req.query.force === "true";
    const result = await migrateResponsesFromJSON(force);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "Migration failed", errors: [(error as Error).message] });
  }
});

/**
 * POST /api/admin/migrate/locations
 */
router.post("/locations", async (req, res) => {
  try {
    const force = req.query.force === "true";
    const result = await migrateLocationsFromJSON(force);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "Migration failed", errors: [(error as Error).message] });
  }
});

/**
 * POST /api/admin/migrate/super-intents
 */
router.post("/super-intents", async (req, res) => {
  try {
    const force = req.query.force === "true";
    const result = await migrateSuperIntentsFromJSON(force);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "Migration failed", errors: [(error as Error).message] });
  }
});

/**
 * GET /api/admin/migrate/status
 */
router.get("/status", async (_req, res) => {
  try {
    const status = await getMigrationStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get migration status" });
  }
});

/**
 * GET /api/admin/migrate/debug
 */
router.get("/debug", async (_req, res) => {
  try {
    const tracking = await db.select().from(migrationTracking);
    res.json({ success: true, count: tracking.length, tracking });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

export default router;
