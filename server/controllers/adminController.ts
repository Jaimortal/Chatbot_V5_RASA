import { Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import PhraseTranslator from "../../rulebaseTranslation/phraseTranslator";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize phrase-based translator
const phraseTranslator = new PhraseTranslator();

type AutoTranslateJob = {
  jobId: string;
  intent: string;
  startedAt: number;
  finishedAt?: number;
  status: "running" | "completed" | "failed";
  error?: string;
};

let currentAutoTranslateJob: AutoTranslateJob | null = null;
let lastAutoTranslateJob: AutoTranslateJob | null = null;

const CEB_POST_FILTER_MAP: Record<string, string> = {
  mabatonan: "anaa",
  nahibulong: "naghunahuna ka",
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyCebuanoPostFilters(text: string) {
  let out = text;
  for (const [src, dst] of Object.entries(CEB_POST_FILTER_MAP)) {
    const re = new RegExp(`\\b${escapeRegExp(src)}\\b`, "gi");
    out = out.replace(re, dst);
  }
  return out;
}

function newJobId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

async function translateToCebuanoViaPython(text: string): Promise<string> {
  const pythonScript = path.join(__dirname, "..", "privateAPI", "translator_service.py");
  const modelPath = process.env.CTRANSLATE2_MODEL_PATH || path.join(__dirname, "..", "privateAPI", "models", "ctranslate2");
  const spmPath = process.env.SENTENCEPIECE_MODEL || path.join(__dirname, "..", "privateAPI", "models", "spm.model");
  const backend = process.env.TRANSLATOR_BACKEND || "auto";

  const candidates: Array<{ cmd: string; argsPrefix: string[] }> = [];
  if (process.env.PYTHON_CMD) {
    candidates.push({ cmd: process.env.PYTHON_CMD, argsPrefix: [] });
  }

  if (process.platform === "win32") {
    candidates.push({ cmd: "py", argsPrefix: ["-3"] });
    candidates.push({ cmd: "python", argsPrefix: [] });
    candidates.push({ cmd: "python3", argsPrefix: [] });
  } else {
    candidates.push({ cmd: "python3", argsPrefix: [] });
    candidates.push({ cmd: "python", argsPrefix: [] });
  }

  const trySpawn = (idx: number): Promise<string> => {
    if (idx >= candidates.length) {
      throw new Error("Python is not available (tried: PYTHON_CMD, py, python, python3)");
    }

    const { cmd, argsPrefix } = candidates[idx];
    const args = [
      ...argsPrefix,
      pythonScript,
      "--text",
      text,
      "--model",
      modelPath,
      "--spm",
      spmPath,
      "--backend",
      backend,
    ];

    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args);
      let stdout = "";
      let stderr = "";
      let settled = false;

      const doneOk = (val: string) => {
        if (settled) return;
        settled = true;
        resolve(val);
      };
      const doneErr = (err: unknown) => {
        if (settled) return;
        settled = true;
        reject(err);
      };

      child.stdout?.on("data", (d) => (stdout += String(d)));
      child.stderr?.on("data", (d) => (stderr += String(d)));

      child.on("error", (err: any) => {
        // If the command doesn't exist, try the next candidate.
        if (err && err.code === "ENOENT") {
          trySpawn(idx + 1).then(doneOk).catch(doneErr);
          return;
        }
        doneErr(err);
      });

      child.on("close", (code) => {
        if (code !== 0) {
          doneErr(new Error(stderr || `Python translator failed with code ${code}`));
          return;
        }

        try {
          const parsed = JSON.parse(stdout);
          if (parsed?.success && typeof parsed.translatedText === "string") {
            doneOk(parsed.translatedText);
            return;
          }
          doneErr(new Error(parsed?.error || "Python translator returned no translatedText"));
        } catch (e) {
          doneErr(new Error(`Failed to parse Python output: ${stdout || stderr}`));
        }
      });
    });
  };

  return trySpawn(0);
}

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
      const body: any = req.body;

      if (
        currentAutoTranslateJob &&
        currentAutoTranslateJob.status === "running" &&
        body?.intent &&
        body.intent !== currentAutoTranslateJob.intent
      ) {
        return res.status(409).json({
          success: false,
          message: "Auto-translation is still running. Please wait for it to finish before editing another intent.",
        });
      }

      const answerRaw = body?.responses?.answer;
      if (Array.isArray(answerRaw)) {
        body.responses = body.responses || {};
        body.responses.answer = { en: answerRaw, ceb: [] };
      }

      const answer = body?.responses?.answer;
      const enLines: string[] = Array.isArray(answer?.en) ? answer.en : [];
      const cebLines: string[] = Array.isArray(answer?.ceb) ? answer.ceb : [];

      const enHasText = enLines.some((l) => String(l).trim().length > 0);
      const cebHasText = cebLines.some((l) => String(l).trim().length > 0);

      const privileges = await getUserPrivileges();
      const autoTranslateEnabled = privileges?.autoTranslateEnabled !== false;

      const shouldAutoTranslate = autoTranslateEnabled && enHasText && !cebHasText;

      if (!cebHasText) {
        body.responses = body.responses || {};
        body.responses.answer = {
          ...(answer || {}),
          en: enLines,
          ceb: [],
        };
      }

      if (shouldAutoTranslate && currentAutoTranslateJob?.status === "running") {
        return res.status(409).json({
          success: false,
          message: "Auto-translation is still running. Please wait for it to finish before saving another intent.",
        });
      }

      const result = await upsertResponse(body);
      if (!result?.success) {
        return res.json(result);
      }

      if (!shouldAutoTranslate || typeof body?.intent !== "string") {
        return res.json({ ...result, translationQueued: false });
      }

      const intent = body.intent;
      const englishText = enLines.join("\n").trim();
      if (!englishText) {
        return res.json({ ...result, translationQueued: false });
      }

      const jobId = newJobId();
      currentAutoTranslateJob = {
        jobId,
        intent,
        startedAt: Date.now(),
        status: "running",
      };

      setImmediate(async () => {
        const job = currentAutoTranslateJob;
        if (!job || job.jobId !== jobId) return;

        try {
          const translated = await phraseTranslator.translateToCebuano(englishText);
          const translatedLines = translated.split(/\r?\n/);

          const responses = await getResponses();
          const idx = responses.findIndex((r: any) => r?.intent === intent);
          if (idx < 0) {
            throw new Error("Saved intent not found while applying auto-translation");
          }

          const target: any = responses[idx];
          const targetAnswerRaw = target?.responses?.answer;
          if (Array.isArray(targetAnswerRaw)) {
            target.responses = target.responses || {};
            target.responses.answer = { en: targetAnswerRaw, ceb: [] };
          }
          const targetAnswer = target?.responses?.answer || {};
          const currentCeb: string[] = Array.isArray(targetAnswer?.ceb) ? targetAnswer.ceb : [];
          const currentCebHasText = currentCeb.some((l) => String(l).trim().length > 0);

          if (!currentCebHasText) {
            target.responses = target.responses || {};
            target.responses.answer = {
              ...targetAnswer,
              ceb: translatedLines,
            };
            await upsertResponse(target);
          }

          lastAutoTranslateJob = {
            ...job,
            status: "completed",
            finishedAt: Date.now(),
          };
        } catch (e: any) {
          lastAutoTranslateJob = {
            ...(job || {
              jobId,
              intent,
              startedAt: Date.now(),
              status: "failed",
            }),
            status: "failed",
            finishedAt: Date.now(),
            error: String(e?.message || e),
          };
        } finally {
          if (currentAutoTranslateJob?.jobId === jobId) {
            currentAutoTranslateJob = null;
          }
        }
      });

      return res.json({ ...result, translationQueued: true, translationJobId: jobId });
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

  // Phrase-based translation endpoint
  static async translateToCebuano(req: Request, res: Response) {
    try {
      const { text } = req.body;
      console.log("[AdminController] /translate request received (phrase-based):", text);
      
      if (!text || typeof text !== "string") {
        return res.status(400).json({ success: false, message: "Text is required" });
      }

      // Use phrase-based translator
      const translated = await phraseTranslator.translateToCebuano(text);
      console.log("[AdminController] Phrase-based translation result:", translated);
      
      res.json({ success: true, translatedText: translated });
    } catch (error) {
      console.error("[AdminController] Phrase-based translation error:", error);
      res.status(500).json({ success: false, message: "Translation failed" });
    }
  }

  static async getAutoTranslateStatus(req: Request, res: Response) {
    try {
      const status = currentAutoTranslateJob?.status === "running" ? "running" : "idle";
      res.json({
        success: true,
        status,
        current: currentAutoTranslateJob,
        lastCompleted: lastAutoTranslateJob,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch auto-translate status" });
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
