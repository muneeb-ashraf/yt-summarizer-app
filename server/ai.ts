import type { Express } from "express";

export async function generateSummary(videoId: string, format: string): Promise<string> {
  // Mock implementation - in production, use Gemini API
  return `This is a sample summary for video ${videoId} in ${format} format.
  
Key points:
- First important point
- Second important point
- Third important point

The video discusses various topics and provides valuable insights.`;
}
