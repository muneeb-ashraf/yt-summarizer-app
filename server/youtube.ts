import type { Express } from "express";
import { db } from "@db";
import { summaries } from "@db/schema";
import { generateSummary } from "./ai";

interface YouTubeMetadata {
  title: string;
  duration: number;
  channelTitle: string;
}

async function getYouTubeMetadata(videoId: string): Promise<YouTubeMetadata> {
  // Mock implementation - in production, use YouTube Data API
  return {
    title: "Sample Video",
    duration: 600,
    channelTitle: "Sample Channel"
  };
}

export function setupYouTubeRoutes(app: Express) {
  app.post("/api/summaries", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { videoId, format, language } = req.body;
    const user = req.user!;

    try {
      // Get video metadata
      const metadata = await getYouTubeMetadata(videoId);
      
      // Generate summary using AI
      const summary = await generateSummary(videoId, format);

      // Save to database
      const [newSummary] = await db
        .insert(summaries)
        .values({
          userId: user.id,
          videoId,
          videoTitle: metadata.title,
          videoDuration: metadata.duration,
          summary,
          format,
          language,
          metadata: metadata
        })
        .returning();

      res.json(newSummary);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/summaries", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const userSummaries = await db.query.summaries.findMany({
      where: (summaries, { eq }) => eq(summaries.userId, req.user!.id),
      orderBy: (summaries, { desc }) => [desc(summaries.createdAt)]
    });

    res.json(userSummaries);
  });
}
