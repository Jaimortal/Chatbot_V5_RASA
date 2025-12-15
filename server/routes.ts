import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { findIntent } from "./rasa";
import {
  getResponses,
  upsertResponse,
  deleteResponse,
  getLocations,
  upsertLocation,
  deleteLocation,
  getUserPrivileges,
  upsertUserPrivileges
} from "./admin";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const expectedKey = process.env.ADMIN_KEY;
    if (!expectedKey) return next();
    const providedKey = req.header("x-admin-key");
    if (providedKey && providedKey === expectedKey) return next();
    return res.status(401).json({ success: false, message: "Unauthorized" });
  };
  
  // CHAT ROUTE
  app.post("/api/chat", (req, res) => {
    const { intent } = req.body;

    const result = findIntent(intent);

    if (!result) {
      return res.json({
        answer: "I cannot understand your question.",
        mapData: null,
        follow_up: []
      });
    }

    // Convert answer array to string
    const answerText = Array.isArray(result.responses.answer) 
      ? result.responses.answer.join("\n")
      : result.responses.answer || "";

    return res.json({
      answer: answerText,
      follow_up: result.responses.follow_up ?? [],
      mapData: result.responses.mapData ?? null
    });
  });

  // PUBLIC USER PRIVILEGES

  app.get("/api/privileges", async (_req, res) => {
    try {
      const privileges = await getUserPrivileges();
      res.json({ success: true, data: privileges });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch privileges" });
    }
  });

  // ADMIN ROUTES
  
  // Get all responses
  app.get("/api/admin/responses", requireAdmin, async (req, res) => {
    try {
      const responses = await getResponses();
      res.json({ success: true, data: responses });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch responses" });
    }
  });

  // Create or update a response
  app.post("/api/admin/responses", requireAdmin, async (req, res) => {
    try {
      const result = await upsertResponse(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to save response" });
    }
  });

  // Delete a response
  app.delete("/api/admin/responses/:intent", requireAdmin, async (req, res) => {
    try {
      const result = await deleteResponse(req.params.intent);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete response" });
    }
  });

  // Get all locations
  app.get("/api/admin/locations", requireAdmin, async (req, res) => {
    try {
      const locations = await getLocations();
      res.json({ success: true, data: locations });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch locations" });
    }
  });

  // Create or update a location
  app.post("/api/admin/locations", requireAdmin, async (req, res) => {
    try {
      const result = await upsertLocation(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to save location" });
    }
  });

  // Delete a location
  app.delete("/api/admin/locations/:id", requireAdmin, async (req, res) => {
    try {
      const result = await deleteLocation(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete location" });
    }
  });

  // USER PRIVILEGES (ADMIN)

  app.get("/api/admin/privileges", requireAdmin, async (_req, res) => {
    try {
      const privileges = await getUserPrivileges();
      res.json({ success: true, data: privileges });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch privileges" });
    }
  });

  app.post("/api/admin/privileges", requireAdmin, async (req, res) => {
    try {
      const result = await upsertUserPrivileges(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to save privileges" });
    }
  });

  return httpServer;
}
