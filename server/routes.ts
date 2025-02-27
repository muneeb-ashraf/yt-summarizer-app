import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import cors from "cors";
import { generateSummary } from "./ai";
import { supabase, getUser, getAuthenticatedClient } from "./lib/supabase";
import z from "zod";

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

async function verifyAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("No auth token provided");
      return res.status(401).json({ error: "No auth token provided" });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUser(token);

    if (!user) {
      console.error("Invalid auth token");
      return res.status(401).json({ error: "Invalid auth token" });
    }

    req.user = user;
    req.supabaseClient = getAuthenticatedClient(token);
    next();
  } catch (error: any) {
    console.error("Auth verification error:", error);
    res.status(401).json({ error: `Authentication failed: ${error.message || "Unknown error"}` });
  }
}

export function registerRoutes(app: Express): Server {
  // Configure CORS
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? true // Allow all origins in production (will mirror request origin)
      : 'http://localhost:5000',
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // API Routes
  app.get("/api/summaries", verifyAuth, async (req: any, res: any) => {
    try {
      console.log('Fetching summaries for user:', req.user.id);
      const { data: summaries, error } = await req.supabaseClient
        .from('summaries')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching summaries:", error);
        return res.status(500).json({ error: "Failed to fetch summaries" });
      }

      return res.status(200).json(summaries);
    } catch (error: any) {
      console.error("Error fetching summaries:", error);
      return res.status(500).json({
        error: error.message || "Failed to fetch summaries",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  app.post("/api/summaries", verifyAuth, async (req: any, res: any) => {
    try {
      console.log('Creating summary with params:', req.body);

      // Validate required API keys
      if (!process.env.GEMINI_API_KEY || !process.env.YOUTUBE_API_KEY) {
        console.error("Missing required API keys");
        return res.status(500).json({ error: "Server configuration error: Missing API keys" });
      }

      const result = createSummarySchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = result.error.issues.map(i => i.message).join(", ");
        console.error("Validation error:", errorMessage);
        return res.status(400).json({ error: errorMessage });
      }

      const { videoId, format, language } = result.data;

      // Get video metadata
      const metadata = await getYouTubeMetadata(videoId);

      // Check video duration for free users
      const { data: userData, error: userError } = await req.supabaseClient
        .from('users')
        .select('subscription')
        .eq('id', req.user.id)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        return res.status(500).json({ error: "Error checking user subscription" });
      }

      if (userData?.subscription === 'free' && metadata.duration > 900) {
        return res.status(400).json({ error: "Free users can only summarize videos up to 15 minutes long" });
      }

      // Generate summary using AI
      console.log("Generating summary for video:", videoId);
      const summary = await generateSummary(videoId, format, language, metadata.description);

      if (!summary) {
        throw new Error("Failed to generate summary from AI");
      }

      // Insert summary
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
        if (insertError.code === '42501') {
          return res.status(403).json({ error: "Permission denied: Cannot create summary" });
        }
        throw new Error(`Failed to save summary: ${insertError.message}`);
      }

      console.log("Successfully created summary:", newSummary.id);
      return res.status(200).json(newSummary);
    } catch (error: any) {
      console.error("Summary creation error:", error);
      return res.status(500).json({
        error: error.message || "Failed to create summary",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  app.delete("/api/summaries/:id", verifyAuth, async (req: any, res: any) => {
    try {
      const summaryId = req.params.id;

      // First verify the summary belongs to the user
      const { data: summary, error: fetchError } = await req.supabaseClient
        .from('summaries')
        .select('user_id')
        .eq('id', summaryId)
        .single();

      if (fetchError) {
        return res.status(404).json({ error: "Summary not found" });
      }

      if (summary.user_id !== req.user.id) {
        return res.status(403).json({ error: "Permission denied: Cannot delete this summary" });
      }

      const { error: deleteError } = await req.supabaseClient
        .from('summaries')
        .delete()
        .eq('id', summaryId)
        .eq('user_id', req.user.id);

      if (deleteError) {
        throw deleteError;
      }

      return res.status(200).json({ message: "Summary deleted successfully" });
    } catch (error: any) {
      console.error("Summary deletion error:", error);
      return res.status(500).json({ error: error.message || "Failed to delete summary" });
    }
  });

  setupAuth(app);
  setupYouTubeRoutes(app);
  setupStripeRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}

async function getYouTubeMetadata(videoId: string) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API key not configured');
    }

    console.log('Fetching YouTube metadata for video:', videoId);
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API error response:', errorData);
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
    throw new Error(`Failed to fetch video metadata: ${error.message}`);
  }
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const [_, hours = '0', minutes = '0', seconds = '0'] = match;
  return (parseInt(hours) * 3600) + (parseInt(minutes) * 60) + parseInt(seconds);
}