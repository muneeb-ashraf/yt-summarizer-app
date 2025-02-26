import type { Express, Request, Response, NextFunction } from "express";
import { supabase, getUser, getAuthenticatedClient } from "./lib/supabase";
import { generateSummary } from "./ai";
import z from "zod";

interface YouTubeMetadata {
  title: string;
  duration: number;
  channelTitle: string;
  description: string;
}

// Extend the Express Request type
interface AuthenticatedRequest extends Request {
  user: any;
  supabaseClient: any;
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
async function verifyAuth(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("No auth token provided");
      return res.status(401).send("No auth token provided");
    }

    const token = authHeader.split(' ')[1];
    const user = await getUser(token);

    if (!user) {
      console.error("Invalid auth token");
      return res.status(401).send("Invalid auth token");
    }

    // Store both user and authenticated client in request
    (req as AuthenticatedRequest).user = user;
    (req as AuthenticatedRequest).supabaseClient = getAuthenticatedClient(token);
    next();
  } catch (error: any) {
    console.error("Auth verification error:", error);
    res.status(401).send("Authentication failed: " + (error.message || "Unknown error"));
  }
}

export function setupYouTubeRoutes(app: Express) {
  app.post("/api/summaries", verifyAuth as any, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("Creating summary with params:", req.body);
      const result = createSummarySchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = result.error.issues.map(i => i.message).join(", ");
        console.error("Validation error:", errorMessage);
        return res.status(400).send(errorMessage);
      }

      const { videoId, format, language } = result.data;

      // Explicitly check for user
      if (!req.user?.id) {
        console.error("User not authenticated");
        return res.status(401).send("User not authenticated");
      }

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
        return res.status(500).send("Error checking user subscription");
      }

      if (userData?.subscription === 'free' && metadata.duration > 900) {
        return res.status(400).send("Free users can only summarize videos up to 15 minutes long");
      }

      // Generate summary using AI
      console.log("Generating summary for video:", videoId);
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
        if (insertError.code === '42501') {
          return res.status(403).send("Permission denied: Cannot create summary");
        }
        throw new Error("Failed to save summary");
      }

      console.log("Successfully created summary:", newSummary.id);
      res.json(newSummary);
    } catch (error: any) {
      console.error("Summary creation error:", error);
      res.status(500).send(error.message || "Failed to create summary");
    }
  });

  app.get("/api/summaries", verifyAuth as any, async (req: AuthenticatedRequest, res: Response) => {
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
        console.error("Error fetching summaries:", error);
        return res.status(500).send("Failed to fetch summaries");
      }

      res.json(summaries);
    } catch (error: any) {
      console.error("Fetching summaries error:", error);
      res.status(500).send(error.message);
    }
  });

  // Add delete endpoint
  app.delete("/api/summaries/:id", verifyAuth as any, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).send("User not authenticated");
      }

      const summaryId = req.params.id;

      // First verify the summary belongs to the user
      const { data: summary, error: fetchError } = await req.supabaseClient
        .from('summaries')
        .select('user_id')
        .eq('id', summaryId)
        .single();

      if (fetchError) {
        return res.status(404).send("Summary not found");
      }

      if (summary.user_id !== req.user.id) {
        return res.status(403).send("Permission denied: Cannot delete this summary");
      }

      const { error: deleteError } = await req.supabaseClient
        .from('summaries')
        .delete()
        .eq('id', summaryId)
        .eq('user_id', req.user.id);

      if (deleteError) {
        throw deleteError;
      }

      res.status(200).send({ message: "Summary deleted successfully" });
    } catch (error: any) {
      console.error("Summary deletion error:", error);
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