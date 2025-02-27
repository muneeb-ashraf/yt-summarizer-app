import type { Express } from "express";
import { createServer, type Server } from "http";
import cors from "cors";
import { generateSummary } from "./ai";
import { supabase, getUser } from "./lib/supabase";
import z from "zod";

const summarySchema = z.object({
  videoId: z.string().min(1, "Video ID is required"),
  format: z.enum(["paragraph", "bullets", "timestamped"]),
  language: z.enum(["en", "es", "fr"])
});

export function registerRoutes(app: Express): Server {
  // Configure CORS
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Single endpoint for summary creation
  app.post("/api/summaries", async (req, res) => {
    try {
      console.log('Received summary request:', {
        method: req.method,
        origin: req.headers.origin,
        contentType: req.headers['content-type']
      });

      // Check required API keys first
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "Server configuration error: Missing AI API key"
        });
      }

      if (!process.env.YOUTUBE_API_KEY) {
        return res.status(500).json({
          error: "Server configuration error: Missing YouTube API key"
        });
      }

      // Parse and validate request body
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (!body) {
        return res.status(400).json({
          error: "Request body is required"
        });
      }

      console.log('Request body:', body);

      const result = summarySchema.safeParse(body);
      if (!result.success) {
        const errorMessage = result.error.issues.map(i => i.message).join(", ");
        return res.status(400).json({
          error: errorMessage
        });
      }

      // Verify auth token
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
          error: "No auth token provided"
        });
      }

      const token = authHeader.split(' ')[1];
      const user = await getUser(token);
      if (!user) {
        return res.status(401).json({
          error: "Invalid auth token"
        });
      }

      const { videoId, format, language } = result.data;

      try {
        // Generate summary
        console.log('Generating summary for video:', videoId);
        const summary = await generateSummary(videoId, format, language, '');

        if (!summary) {
          return res.status(500).json({
            error: "Failed to generate summary"
          });
        }

        // Save to database
        const { data: newSummary, error: saveError } = await supabase
          .from('summaries')
          .insert({
            user_id: user.id,
            video_id: videoId,
            summary,
            format,
            language
          })
          .select()
          .single();

        if (saveError) {
          console.error("Error saving summary:", saveError);
          return res.status(500).json({
            error: "Failed to save summary"
          });
        }

        console.log('Summary created successfully:', newSummary.id);
        return res.status(200).json(newSummary);

      } catch (error: any) {
        console.error("Summary generation/save error:", error);
        return res.status(500).json({
          error: error.message || "Failed to process summary"
        });
      }
    } catch (error: any) {
      console.error("API error:", error);
      return res.status(500).json({
        error: error.message || "Internal server error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}