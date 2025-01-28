import type { Express } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

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

async function chunkText(text: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 200,
  });

  return await splitter.splitText(text);
}

function formatPrompt(format: string, language: string): string {
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

    // Split the text into manageable chunks
    const chunks = await chunkText(description);

    // Process each chunk and combine the results
    const prompt = formatPrompt(format, language);
    let combinedSummary = "";

    for (const chunk of chunks) {
      const result = await model.generateContent([
        prompt,
        `Content to summarize:\n${chunk}`
      ]);
      const response = await result.response;
      combinedSummary += response.text() + "\n\n";
    }

    // Format the final summary based on the requested format
    if (format === 'bullets') {
      // Ensure bullet points are properly formatted
      return combinedSummary
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.startsWith('-') ? line : `- ${line}`)
        .join('\n');
    }

    return combinedSummary.trim();
  } catch (error: any) {
    console.error("AI generation error:", error);
    throw new Error("Failed to generate summary: " + error.message);
  }
}