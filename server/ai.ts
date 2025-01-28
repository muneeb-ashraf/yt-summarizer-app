import type { Express } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

// This will be initialized once the GEMINI_API_KEY is available
let genAI: GoogleGenerativeAI | null = null;

function initializeAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required");
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return genAI;
}

function formatPrompt(format: string, language: string): string {
  const languageMap = {
    en: "English",
    es: "Spanish",
    fr: "French"
  };

  const formatMap = {
    paragraph: "Write a comprehensive paragraph summary",
    bullets: "Create a bullet-point summary with the main points",
    timestamped: "Create a timestamped summary showing key moments"
  };

  return `Please ${formatMap[format as keyof typeof formatMap]} 
          of the following YouTube video transcript in ${languageMap[language as keyof typeof languageMap]}.
          Focus on the main ideas, key points, and important details.`;
}

export async function generateSummary(
  videoId: string, 
  format: string,
  language: string
): Promise<string> {
  try {
    // For now, return mock data until we have the API key
    if (!process.env.GEMINI_API_KEY) {
      return `This is a sample summary for video ${videoId} in ${format} format.

Key points:
- First important point
- Second important point
- Third important point

The video discusses various topics and provides valuable insights.`;
    }

    const ai = initializeAI();
    const model = ai.getGenerativeModel({ model: "gemini-pro" });

    // TODO: Integrate with YouTube API to get actual transcript
    const mockTranscript = `This is a mock transcript for video ${videoId}. 
                           It contains important information and key points.`;

    const prompt = formatPrompt(format, language);

    const result = await model.generateContent([
      prompt,
      mockTranscript
    ]);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("AI generation error:", error);
    throw new Error("Failed to generate summary: " + error.message);
  }
}