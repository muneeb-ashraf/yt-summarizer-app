import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupYouTubeRoutes } from "./youtube";
import { setupStripeRoutes } from "./stripe";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);
  setupYouTubeRoutes(app);
  setupStripeRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}