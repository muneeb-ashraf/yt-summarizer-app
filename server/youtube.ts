import type { Express } from "express";
import { db } from "@db";
import { summaries } from "@db/schema";
import { generateSummary } from "./ai";
import z from "zod";

interface YouTubeMetadata {
  title: string;
  duration: number;
  channelTitle: string;
}

const createSummarySchema = z.object({
  videoId: z.string().min(1, "Video ID is required"),
  format: z.enum(["paragraph", "bullets", "timestamped"], {
    required_error: "Format is required",
    invalid_type_error: "Invalid format type"
  }),
  language: z.enum(["en", "es", "fr"], {
    required_error: "Language is required",
    invalid_type_error: "Invalid language"
  })
});

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

    try {
      // Validate input
      const result = createSummarySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).send(result.error.issues.map(i => i.message).join(", "));
      }

      const { videoId, format, language } = result.data;
      const user = req.user!;

      // Get video metadata
      const metadata = await getYouTubeMetadata(videoId);

      // Generate summary using AI
      const summary = await generateSummary(videoId, format, language);

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
      console.error("Summary creation error:", error);
      res.status(500).send(error.message);
    }
  });

  app.get("/api/summaries", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const userSummaries = await db.query.summaries.findMany({
        where: (summaries, { eq }) => eq(summaries.userId, req.user!.id),
        orderBy: (summaries, { desc }) => [desc(summaries.createdAt)]
      });

      res.json(userSummaries);
    } catch (error: any) {
      console.error("Fetching summaries error:", error);
      res.status(500).send(error.message);
    }
  });
}