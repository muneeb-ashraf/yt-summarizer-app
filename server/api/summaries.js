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

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const corsMiddleware = cors(corsOptions);

export default async function handler(req, res) {
  // Ensure response is always JSON
  res.setHeader('Content-Type', 'application/json');

  try {
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
      return res.status(200).json({ status: 'ok' });
    }

    // Verify required API keys
    if (!process.env.GEMINI_API_KEY || !process.env.YOUTUBE_API_KEY) {
      return res.status(500).json({ 
        error: "Server configuration error: Missing required API keys" 
      });
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No auth token provided" });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUser(token);

    if (!user) {
      return res.status(401).json({ error: "Invalid auth token" });
    }

    const supabaseClient = getAuthenticatedClient(token);

    if (req.method === 'POST') {
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        const result = createSummarySchema.safeParse(body);
        if (!result.success) {
          return res.status(400).json({ 
            error: result.error.issues.map(i => i.message).join(", ") 
          });
        }

        const { videoId, format, language } = result.data;

        // Get video metadata
        const metadata = await getYouTubeMetadata(videoId);

        // Check video duration for free users
        const { data: userData, error: userError } = await supabaseClient
          .from('users')
          .select('subscription')
          .eq('id', user.id)
          .single();

        if (userError) {
          return res.status(500).json({ error: "Error checking user subscription" });
        }

        if (userData?.subscription === 'free' && metadata.duration > 900) {
          return res.status(400).json({ 
            error: "Free users can only summarize videos up to 15 minutes long" 
          });
        }

        // Generate summary
        const summary = await generateSummary(videoId, format, language, metadata.description);

        if (!summary) {
          return res.status(500).json({ error: "Failed to generate summary" });
        }

        // Save to database
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
          if (insertError.code === '42501') {
            return res.status(403).json({ 
              error: "Permission denied: Cannot create summary" 
            });
          }
          return res.status(500).json({ 
            error: `Failed to save summary: ${insertError.message}` 
          });
        }

        return res.status(200).json(newSummary);
      } catch (error) {
        console.error("Summary creation error:", error);
        return res.status(500).json({
          error: error.message || "Failed to create summary"
        });
      }
    }

    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error"
    });
  }
}

async function getYouTubeMetadata(videoId) {
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