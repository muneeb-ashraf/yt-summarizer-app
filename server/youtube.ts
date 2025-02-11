import type { Express } from "express";
import { supabase, getUser, getAuthenticatedClient } from "./lib/supabase";
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

// Middleware to verify Supabase auth token
async function verifyAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).send("No auth token provided");
    }

    const token = authHeader.split(' ')[1];
    const user = await getUser(token);

    if (!user) {
      return res.status(401).send("Invalid auth token");
    }

    req.user = user;
    req.supabaseClient = getAuthenticatedClient(token);
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

      // Explicitly check for user
      if (!req.user?.id) {
        return res.status(401).send("User not authenticated");
      }

      // Get video metadata
      const metadata = await getYouTubeMetadata(videoId);

      // Check video duration for free users
      const { data: userData } = await req.supabaseClient
        .from('users')
        .select('subscription')
        .eq('id', req.user.id)
        .single();

      if (userData?.subscription === 'free' && metadata.duration > 900) {
        return res.status(400).send("Free users can only summarize videos up to 15 minutes long");
      }

      // Generate summary using AI
      const summary = await generateSummary(videoId, format, language, metadata.description);

      // Insert with explicit user_id from authenticated user
      const { data: newSummary, error: insertError } = await req.supabaseClient
        .from('summaries')
        .insert({
          user_id: req.user.id,
          video_id: videoId,
          video_title: metadata.title,
          video_duration: metadata.duration,
          summary,
          format,
          language,
          metadata: {
            channelTitle: metadata.channelTitle
          }
        })
        .select()
        .single();

      if (insertError) {
        console.error("Summary creation error:", insertError);
        throw new Error("Failed to save summary");
      }

      res.json(newSummary);
    } catch (error: any) {
      console.error("Summary creation error:", error);
      res.status(500).send(error.message);
    }
  });

  app.get("/api/summaries", verifyAuth, async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).send("User not authenticated");
      }

      const { data: summaries, error } = await req.supabaseClient
        .from('summaries')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      res.json(summaries);
    } catch (error: any) {
      console.error("Fetching summaries error:", error);
      res.status(500).send(error.message);
    }
  });
}

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