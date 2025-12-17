import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { ChatController } from "./controllers/chatController";
import { AdminController } from "./controllers/adminController";
import { AuthController } from "./controllers/authController";
import jwt from "jsonwebtoken";

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

  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (!decoded) {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }
      
      // Attach user info to request for potential use
      (req as any).user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
  };
  
  // AUTHENTICATION ROUTES
  app.post("/api/admin/login", AuthController.login);
  app.post("/api/admin/google-login", AuthController.googleLogin);
  app.post("/api/admin/verify", AuthController.verify);
  app.post("/api/admin/logout", AuthController.logout);
  
  // CHAT ROUTE
  app.post("/api/chat", ChatController.handleChat);

  // PUBLIC USER PRIVILEGES

  app.get("/api/privileges", AdminController.getUserPrivileges);

  // ADMIN ROUTES
  
  // Get all responses
  app.get("/api/admin/responses", requireAuth, AdminController.getResponses);

  // Create or update a response
  app.post("/api/admin/responses", requireAuth, AdminController.createOrUpdateResponse);

  // Delete a response
  app.delete("/api/admin/responses/:intent", requireAuth, AdminController.deleteResponse);

  // Get all locations
  app.get("/api/admin/locations", requireAuth, AdminController.getLocations);

  // Create or update a location
  app.post("/api/admin/locations", requireAuth, AdminController.createOrUpdateLocation);

  // Delete a location
  app.delete("/api/admin/locations/:id", requireAuth, AdminController.deleteLocation);

  // USER PRIVILEGES (ADMIN)

  app.get("/api/admin/privileges", requireAuth, AdminController.getUserPrivileges);

  app.post("/api/admin/privileges", requireAuth, AdminController.updateUserPrivileges);

  return httpServer;
}
