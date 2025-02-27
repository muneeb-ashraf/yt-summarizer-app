import { setupYouTubeRoutes } from '../youtube';
import cors from 'cors';
import { generateSummary } from '../ai';
import { supabase, getUser, getAuthenticatedClient } from '../lib/supabase';
import z from 'zod';

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

// Configure CORS for production
const corsOptions = {
  origin: true, // This will mirror the origin header in the request
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const corsMiddleware = cors(corsOptions);

export default async function handler(req, res) {
  // Log environment variables and request details
  console.log('Request details:', {
    method: req.method,
    path: req.url,
    origin: req.headers.origin,
    env: process.env.NODE_ENV,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasYoutubeKey: !!process.env.YOUTUBE_API_KEY
  });

  // Handle CORS
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify required API keys
    if (!process.env.GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY in environment");
      return res.status(500).json({ error: "Server configuration error: Missing API key" });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      console.error("Missing YOUTUBE_API_KEY in environment");
      return res.status(500).json({ error: "Server configuration error: Missing YouTube API key" });
    }

    // Verify authentication
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

    const supabaseClient = getAuthenticatedClient(token);

    if (req.method === 'GET') {
      console.log('Fetching summaries for user:', user.id);
      const { data: summaries, error } = await supabaseClient
        .from('summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching summaries:", error);
        return res.status(500).json({ error: "Failed to fetch summaries" });
      }

      return res.status(200).json(summaries);
    }

    if (req.method === 'POST') {
      // Parse request body if it's a string
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      console.log('Creating summary with params:', body);

      const result = createSummarySchema.safeParse(body);
      if (!result.success) {
        const errorMessage = result.error.issues.map(i => i.message).join(", ");
        console.error("Validation error:", errorMessage);
        return res.status(400).json({ error: errorMessage });
      }

      const { videoId, format, language } = result.data;

      try {
        // Get video metadata
        const metadata = await getYouTubeMetadata(videoId);
        console.log('Successfully fetched video metadata:', {
          title: metadata.title,
          duration: metadata.duration,
          channelTitle: metadata.channelTitle
        });

        // Check video duration for free users
        const { data: userData, error: userError } = await supabaseClient
          .from('users')
          .select('subscription')
          .eq('id', user.id)
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

        // Insert with explicit user_id from authenticated user
        const { data: newSummary, error: insertError } = await supabaseClient
          .from('summaries')
          .insert({
            user_id: user.id,
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
      } catch (error) {
        console.error("Error during summary creation process:", error);
        return res.status(500).json({
          error: error.message || "Failed to create summary",
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }

    // Handle unsupported methods
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function getYouTubeMetadata(videoId) {
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

    const metadata = {
      title: video.snippet.title,
      duration,
      channelTitle: video.snippet.channelTitle,
      description: video.snippet.description
    };

    console.log('Successfully fetched video metadata:', {
      title: metadata.title,
      duration: metadata.duration,
      channelTitle: metadata.channelTitle
    });

    return metadata;
  } catch (error) {
    console.error('YouTube API error:', error);
    throw new Error(`Failed to fetch video metadata: ${error.message}`);
  }
}

function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const [_, hours = '0', minutes = '0', seconds = '0'] = match;
  return (parseInt(hours) * 3600) + (parseInt(minutes) * 60) + parseInt(seconds);
}