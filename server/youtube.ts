import type { Express } from "express";
import { db } from "@db";
import { summaries } from "@db/schema";
import { generateSummary } from "./ai";
import z from "zod";

interface YouTubeMetadata {
  title: string;
  duration: number;
  channelTitle: string;
  description: string;
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
  try {
    const apiKey = 'AIzaSyCS1TKwQh9EI4gD3qBJe6-gYEqHR-FbQHc'; // This is a public API key for demo
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch video metadata');
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = data.items[0];
    return {
      title: video.snippet.title,
      duration: parseDuration(video.contentDetails.duration),
      channelTitle: video.snippet.channelTitle,
      description: video.snippet.description
    };
  } catch (error) {
    console.error('YouTube API error:', error);
    throw new Error('Failed to fetch video metadata');
  }
}

// Helper function to parse ISO 8601 duration to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (match[1] || '0H').slice(0, -1);
  const minutes = (match[2] || '0M').slice(0, -1);
  const seconds = (match[3] || '0S').slice(0, -1);

  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
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

      // Check video duration for free users
      if (user.subscription === 'free' && metadata.duration > 900) { // 15 minutes = 900 seconds
        return res.status(400).send("Free users can only summarize videos up to 15 minutes long");
      }

      // Generate summary using AI
      const summary = await generateSummary(videoId, format, language, metadata.description);

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
          metadata
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