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

function formatPrompt(format: string, language: string, description: string): string {
  const languageMap = {
    en: "English",
    es: "Spanish",
    fr: "French"
  };

  const formatMap = {
    paragraph: `Create a comprehensive paragraph summary that captures the main ideas and key insights from the video.
                Focus on the most important points while maintaining a clear narrative flow.`,
    bullets: `Create a structured bullet-point summary with:
             - Main topic and overall theme
             - Key points and major takeaways
             - Important details and examples
             - Conclusions or final thoughts`,
    timestamped: `Create a chronological summary that highlights key moments and transitions in the video:
                  - Start with a brief overview
                  - List major points with estimated timestamps
                  - Include transitions between main topics
                  - End with key takeaways`
  };

  return `You are an expert content summarizer.

Task: ${formatMap[format as keyof typeof formatMap]}

Language: Please provide the summary in ${languageMap[language as keyof typeof languageMap]}.

Video Description:
${description}

Guidelines:
- Maintain accuracy and objectivity
- Focus on key information and main ideas
- Use clear and concise language
- Ensure the summary is self-contained and understandable
- Length should be appropriate to cover all key points`;
}

export async function generateSummary(
  videoId: string, 
  format: string,
  language: string,
  description: string
): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required for summary generation");
    }

    const ai = initializeAI();
    const model = ai.getGenerativeModel({ model: "gemini-pro" });

    const prompt = formatPrompt(format, language, description);

    const result = await model.generateContent([prompt]);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("AI generation error:", error);
    throw new Error("Failed to generate summary: " + error.message);
  }
}