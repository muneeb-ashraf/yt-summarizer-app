import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/utils/supabase/server";
import { nanoid } from 'nanoid';

// N8N webhook URL - in production, this should be in environment variables
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://n8n.mjdraperiesandinteriors.com/webhook/ytube";

export async function POST(request: NextRequest) {
  try {
    // 1. Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get the YouTube URL from the request
    const { youtubeUrl } = await request.json();
    if (!youtubeUrl) {
      return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 });
    }

    // 3. Send the YouTube URL to the n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ youtubeUrl }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("N8N API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Failed to generate summary: ${errorText}` },
        { status: 500 }
      );
    }

    // --- Debugging n8n response ---
    const responseClone = response.clone(); // Clone the response to read body twice
    const contentType = response.headers.get('content-type');
    const rawResponseBody = await responseClone.text();
    // console.log("N8N Response Content-Type:", contentType); // Keep for debugging if needed
    // console.log("N8N Raw Response Body:", rawResponseBody);
    // --- End Debugging ---

    // 4. Get the summary data from the n8n response
    let summaryContent = '';
    try {
      // Re-use original response object here
      if (contentType && contentType.includes('application/json')) {
        // If content type is JSON, parse the raw text we already got
        const summaryData = JSON.parse(rawResponseBody);
        // *** Extract from 'cleanedHtml' based on logs ***
        summaryContent = summaryData.cleanedHtml; 
        if (!summaryContent) {
            console.warn("Parsed JSON but 'cleanedHtml' property was missing or empty. Trying fallbacks.", summaryData);
            // Attempt fallback keys (less likely now but keep for robustness)
            summaryContent = summaryData.summary || summaryData.text || summaryData.result || summaryData.content;
        }
      } else {
        // If not JSON, use the raw text
        summaryContent = rawResponseBody;
      }
    } catch (parseError) {
       console.error("Error parsing N8N response:", parseError);
       // Fallback to raw text if JSON parsing failed unexpectedly
       summaryContent = rawResponseBody;
    }

    if (!summaryContent || summaryContent.trim() === '') { // Check for empty or whitespace-only
       console.error("Summary content is empty after parsing.");
       return NextResponse.json(
        { error: "Received empty summary from webhook" },
        { status: 500 }
      );
    }
    
    // 5. Initialize Supabase client
    const supabase = await createClient();
    
    // 6. Store the summary in the database (stores the HTML content)
    const { data, error } = await supabase
      .from("summaries")
      .insert({
        id: nanoid(),
        user_id: userId,
        youtube_url: youtubeUrl,
        summary_content: summaryContent, // Store the HTML content
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: `Failed to save summary: ${error.message}` },
        { status: 500 }
      );
    }

    // 7. Return the summary data and the database record
    return NextResponse.json({ 
      success: true, 
      summary: data // Contains the saved record including the HTML summary_content
    });
    
  } catch (error) {
    console.error("Summary generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 