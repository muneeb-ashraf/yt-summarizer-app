import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupYouTubeRoutes } from "./youtube";
import { setupStripeRoutes } from "./stripe";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Reset user credits route
  app.post("/api/reset-credits", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const user = req.user!;
      await db
        .update(users)
        .set({ subscription: "free" })
        .where(eq(users.id, user.id));

      res.json({ message: "Credits reset successfully" });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  setupAuth(app);
  setupYouTubeRoutes(app);
  setupStripeRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}