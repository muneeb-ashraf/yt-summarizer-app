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

    // 4. Get the summary data from the n8n response
    let summaryContent = '';
    try {
      const rawResponseBody = await response.text(); // Read text body first

      // Check content type AFTER reading the body
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        try {
          // Attempt to parse only if header indicates JSON
          const summaryData = JSON.parse(rawResponseBody);
          // *** Extract from 'cleanedHtml' based on logs ***
          summaryContent = summaryData.cleanedHtml;
          if (!summaryContent) {
              console.warn("Parsed JSON but 'cleanedHtml' property was missing or empty. Trying fallbacks.", summaryData);
              // Attempt fallback keys (less likely now but keep for robustness)
              summaryContent = summaryData.summary || summaryData.text || summaryData.result || summaryData.content;
          }
          // If still no content after parsing JSON and checking keys, treat as empty
          if (!summaryContent || summaryContent.trim() === '') {
             console.error("Summary content is empty after parsing JSON response.");
             // Fallback to raw body ONLY IF IT CONTAINS SOMETHING OTHER THAN EMPTY JSON
             if (rawResponseBody.trim() !== '{}' && rawResponseBody.trim() !== '') {
                console.warn("Falling back to raw response body as JSON parsing yielded no content.");
                summaryContent = rawResponseBody;
             } else {
                return NextResponse.json(
                    { error: "Received empty summary content from webhook (JSON)" },
                    { status: 500 }
                );
             }
          }
        } catch (parseError) {
          // JSON parsing failed even though header said JSON
          console.error("Error parsing N8N JSON response despite header:", parseError);
          console.warn("Raw response body was:", rawResponseBody);
          // Fallback to raw text IF IT IS NOT EMPTY
          if (rawResponseBody && rawResponseBody.trim() !== '') {
            summaryContent = rawResponseBody;
          } else {
            return NextResponse.json(
                { error: "Failed to parse summary response from webhook" },
                { status: 500 }
            );
          }
        }
      } else {
        // If not JSON according to header, use the raw text directly
        summaryContent = rawResponseBody;
        if (!summaryContent || summaryContent.trim() === '') {
           console.error("Received empty non-JSON response from webhook.");
           return NextResponse.json(
            { error: "Received empty summary response from webhook" },
            { status: 500 }
          );
        }
      }
    } catch (readError) {
        console.error("Error reading N8N response body:", readError);
        return NextResponse.json(
            { error: "Could not read response from summary service" },
            { status: 500 }
        );
    }

    // Final check after all parsing/fallback attempts
    if (!summaryContent || summaryContent.trim() === '') {
      console.error("Summary content is ultimately empty after all checks.");
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