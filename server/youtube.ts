import type { Express } from "express";
import { db } from "@db";
import { summaries } from "@db/schema";
import { generateSummary } from "./ai";
import z from "zod";
import { supabase } from "./lib/supabase";

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
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = data.items[0];
    const duration = parseDuration(video.contentDetails.duration);

    return {
      title: video.snippet.title,
      duration,
      channelTitle: video.snippet.channelTitle,
      description: video.snippet.description
    };
  } catch (error: any) {
    console.error('YouTube API error:', error);
    throw new Error('Failed to fetch video metadata');
  }
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const [_, hours = '0', minutes = '0', seconds = '0'] = match;
  return (parseInt(hours) * 3600) + (parseInt(minutes) * 60) + parseInt(seconds);
}

// Middleware to verify Supabase auth token
async function verifyAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).send("No auth token provided");
    }

    const token = authHeader.split(' ')[1];

    // Make direct HTTP request to Supabase auth endpoint
    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.SUPABASE_ANON_KEY || ''
      }
    });

    if (!response.ok) {
      return res.status(401).send("Invalid auth token");
    }

    const userData = await response.json();

    if (!userData) {
      return res.status(401).send("User not found");
    }

    // Add user data to request
    req.user = {
      id: userData.id,
      email: userData.email,
      subscription: 'free' // Default to free subscription
    };

    next();
  } catch (error: any) {
    console.error("Auth verification error:", error);
    res.status(401).send("Authentication failed: " + (error.message || "Unknown error"));
  }
}

export function setupYouTubeRoutes(app: Express) {
  app.post("/api/summaries", verifyAuth, async (req, res) => {
    try {
      const result = createSummarySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).send(result.error.issues.map(i => i.message).join(", "));
      }

      const { videoId, format, language } = result.data;
      const user = req.user;

      // Get video metadata
      const metadata = await getYouTubeMetadata(videoId);

      // Check video duration for free users
      if (user.subscription === 'free' && metadata.duration > 900) {
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

  app.get("/api/summaries", verifyAuth, async (req, res) => {
    try {
      const userSummaries = await db.query.summaries.findMany({
        where: (summaries, { eq }) => eq(summaries.userId, req.user.id),
        orderBy: (summaries, { desc }) => [desc(summaries.createdAt)]
      });

      res.json(userSummaries);
    } catch (error: any) {
      console.error("Fetching summaries error:", error);
      res.status(500).send(error.message);
    }
  });
}