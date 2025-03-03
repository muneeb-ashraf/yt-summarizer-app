import type { Express } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

let genAI: GoogleGenerativeAI | null = null;

function initializeAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required");
  }

  if (!genAI) {
    console.log('Initializing Gemini AI with API key');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return genAI;
}

async function chunkText(text: string) {
  if (!text || text.trim().length === 0) {
    return ['No description available'];
  }

  console.log('Chunking text of length:', text.length);
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.splitText(text);
  console.log('Split text into', chunks.length, 'chunks');
  return chunks;
}

function formatPrompt(format: string, language: string): string {
  console.log('Formatting prompt for:', format, language);
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
    console.log('Starting summary generation for video:', videoId);

    const ai = initializeAI();
    console.log('AI service initialized');

    const model = ai.getGenerativeModel({ 
      model: "gemini-1.0-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });
    console.log('Got generative model instance');

    // Split the text into manageable chunks
    const chunks = await chunkText(description);
    console.log('Text split into chunks, processing...');

    // Process each chunk and combine the results
    const prompt = formatPrompt(format, language);
    let combinedSummary = "";

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      const chunk = chunks[i];

      try {
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }, { text: `Content to summarize:\n${chunk}` }]}],
        });

        const response = await result.response;
        const text = response.text();
        console.log(`Successfully generated summary for chunk ${i + 1}`);
        combinedSummary += text + "\n\n";
      } catch (error: any) {
        console.error(`Error processing chunk ${i + 1}:`, error);
        throw new Error(`Failed to process chunk ${i + 1}: ${error.message}`);
      }
    }

    // Format the final summary based on the requested format
    if (format === 'bullets') {
      console.log('Formatting bullet points');
      // Ensure bullet points are properly formatted
      return combinedSummary
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.startsWith('-') ? line : `- ${line}`)
        .join('\n');
    }

    console.log('Summary generation completed successfully');
    return combinedSummary.trim();
  } catch (error: any) {
    console.error("AI generation error:", error);
    throw new Error("Failed to generate summary: " + error.message);
  }
}