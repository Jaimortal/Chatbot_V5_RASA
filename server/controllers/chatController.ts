import { Request, Response } from "express";
import { findIntent } from "../rasa";
import { storage } from "../storage";
import type { InsertConversationLog } from "@shared/schema";

type AnswerValue = string | string[] | Record<string, unknown> | undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const pickStringFromValue = (
  value: unknown,
  options: { randomize?: boolean } = {}
): string => {
  const { randomize = false } = options;

  if (Array.isArray(value)) {
    if (value.length === 0) return "";

    if (randomize) {
      const chosen = value[Math.floor(Math.random() * value.length)];
      if (Array.isArray(chosen)) {
        return chosen.filter((item): item is string => typeof item === "string").join("\n");
      }
      return typeof chosen === "string" ? chosen : "";
    }

    return value.filter((item): item is string => typeof item === "string").join("\n");
  }

  return typeof value === "string" ? value : "";
};

const selectAnswerText = (answer: AnswerValue, preferredLanguage?: string): string => {
  if (isRecord(answer)) {
    const normalizedLang = preferredLanguage?.toLowerCase();
    const languageKeys = [
      normalizedLang,
      "en"
    ].filter(Boolean) as string[];

    let selected: unknown;
    for (const key of languageKeys) {
      if (answer[key] !== undefined) {
        selected = answer[key];
        break;
      }
    }

    if (selected === undefined) {
      const [firstKey] = Object.keys(answer);
      selected = firstKey ? answer[firstKey] : undefined;
    }

    return pickStringFromValue(selected, { randomize: true });
  }

  return pickStringFromValue(answer, { randomize: false });
};

export class ChatController {
  static async handleChat(req: Request, res: Response) {
    const startTime = Date.now();
    const userMessageTimestamp = new Date();
    
    try {
      const { intent, language, lang, sessionId = "default" } = req.body;
      const preferredLanguage: string | undefined = language || lang;

      const result = findIntent(intent);

      let answerText = "I cannot understand your question.";
      let detectedIntent = null;
      
      if (result) {
        answerText = selectAnswerText(result.responses.answer, preferredLanguage);
        detectedIntent = result.intent;
      }

      const botResponseTimestamp = new Date();
      const responseTime = Date.now() - startTime;

      // Log the conversation with timestamps
      const conversationLog: Omit<InsertConversationLog, 'id' | 'createdAt'> = {
        sessionId,
        userMessage: intent,
        botResponse: answerText,
        userMessageTimestamp,
        botResponseTimestamp,
        intent: detectedIntent,
        language: preferredLanguage || "en",
        responseTime,
      };

      // Store the conversation log asynchronously (don't wait for it)
      storage.createConversationLog(conversationLog).catch(error => {
        console.error("Failed to log conversation:", error);
      });

      return res.json({
        answer: answerText,
        follow_up: result?.responses.follow_up ?? [],
        mapData: result?.responses.mapData ?? null
      });
    } catch (error) {
      console.error("Chat controller error:", error);
      
      // Log the error conversation
      const conversationLog: Omit<InsertConversationLog, 'id' | 'createdAt'> = {
        sessionId: req.body.sessionId || "default",
        userMessage: req.body.intent || "unknown",
        botResponse: "Error: Failed to process message",
        userMessageTimestamp,
        botResponseTimestamp: new Date(),
        intent: null,
        language: req.body.language || req.body.lang || "en",
        responseTime: Date.now() - startTime,
      };

      storage.createConversationLog(conversationLog).catch(error => {
        console.error("Failed to log conversation error:", error);
      });

      res.status(500).json({ 
        success: false, 
        message: "Internal server error in chat processing" 
      });
    }
  }
}
