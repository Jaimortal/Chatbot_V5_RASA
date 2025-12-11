import type { Express } from "express";
import { type Server } from "http";
import { findIntent } from "./rasa";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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

    return res.json({
      answer: result.responses.answer,
      follow_up: result.responses.follow_up ?? [],
      mapData: result.responses.mapData ?? null
    });
  });

  return httpServer;
}
