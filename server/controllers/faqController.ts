import { Request, Response } from "express";
import * as dbFaqs from "../db/faqs.js";
import { type InsertFaqConfig } from "../../shared/schema.js";

export class FaqController {
  // Public chat endpoint: get active FAQs
  static async getActiveFaqs(req: Request, res: Response) {
    try {
      const faqs = await dbFaqs.getActiveFaqs();
      return res.json({ success: true, data: faqs });
    } catch (error) {
      console.error("Error fetching active FAQs:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Admin endpoint: get all FAQs
  static async getAllFaqs(req: Request, res: Response) {
    try {
      const faqs = await dbFaqs.getAllFaqs();
      return res.json({ success: true, data: faqs });
    } catch (error) {
      console.error("Error fetching all FAQs:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Admin endpoint: create or update FAQ
  static async upsertFaq(req: Request, res: Response) {
    try {
      const data = req.body as InsertFaqConfig & { id?: string };
      if (!data.topicKey || !data.superIntent || !data.displayLabel || !data.payload) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      const result = await dbFaqs.upsertFaq(data);
      if (result) {
        return res.json({ success: true, data: result, message: "FAQ saved successfully" });
      }
      return res.status(500).json({ success: false, message: "Failed to save FAQ" });
    } catch (error) {
      console.error("Error saving FAQ:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Admin endpoint: delete FAQ
  static async deleteFaq(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ success: false, message: "ID is required" });
      }

      const result = await dbFaqs.deleteFaq(id);
      if (result) {
        return res.json({ success: true, message: "FAQ deleted successfully" });
      }
      return res.status(500).json({ success: false, message: "Failed to delete FAQ" });
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
}
