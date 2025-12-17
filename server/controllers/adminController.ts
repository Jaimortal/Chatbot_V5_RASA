import { Request, Response } from "express";
import {
  getResponses,
  upsertResponse,
  deleteResponse,
  getLocations,
  upsertLocation,
  deleteLocation,
  getUserPrivileges,
  upsertUserPrivileges
} from "../admin";

export class AdminController {
  // Response management
  static async getResponses(req: Request, res: Response) {
    try {
      const responses = await getResponses();
      res.json({ success: true, data: responses });
    } catch (error) {
      console.error("Error fetching responses:", error);
      res.status(500).json({ success: false, message: "Failed to fetch responses" });
    }
  }

  static async createOrUpdateResponse(req: Request, res: Response) {
    try {
      const result = await upsertResponse(req.body);
      res.json(result);
    } catch (error) {
      console.error("Error saving response:", error);
      res.status(500).json({ success: false, message: "Failed to save response" });
    }
  }

  static async deleteResponse(req: Request, res: Response) {
    try {
      res.status(403).json({
        success: false,
        message: "Deleting intents is disabled"
      });
    } catch (error) {
      console.error("Error deleting response:", error);
      res.status(500).json({ success: false, message: "Failed to delete response" });
    }
  }

  // Location management
  static async getLocations(req: Request, res: Response) {
    try {
      const locations = await getLocations();
      res.json({ success: true, data: locations });
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ success: false, message: "Failed to fetch locations" });
    }
  }

  static async createOrUpdateLocation(req: Request, res: Response) {
    try {
      const result = await upsertLocation(req.body);
      res.json(result);
    } catch (error) {
      console.error("Error saving location:", error);
      res.status(500).json({ success: false, message: "Failed to save location" });
    }
  }

  static async deleteLocation(req: Request, res: Response) {
    try {
      const result = await deleteLocation(req.params.id);
      res.json(result);
    } catch (error) {
      console.error("Error deleting location:", error);
      res.status(500).json({ success: false, message: "Failed to delete location" });
    }
  }

  // User privileges management
  static async getUserPrivileges(req: Request, res: Response) {
    try {
      const privileges = await getUserPrivileges();
      res.json({ success: true, data: privileges });
    } catch (error) {
      console.error("Error fetching privileges:", error);
      res.status(500).json({ success: false, message: "Failed to fetch privileges" });
    }
  }

  static async updateUserPrivileges(req: Request, res: Response) {
    try {
      const result = await upsertUserPrivileges(req.body);
      res.json(result);
    } catch (error) {
      console.error("Error saving privileges:", error);
      res.status(500).json({ success: false, message: "Failed to save privileges" });
    }
  }
}
