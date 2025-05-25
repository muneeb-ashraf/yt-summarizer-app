import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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

    // 3. Create a new summary in the database
    const summary = await prisma.summary.create({
      data: {
        user_id: userId,
        youtube_url: youtubeUrl,
        summary_content: "pending",
      },
    });

    // 4. Start the summarization process in the background
    processSummary(summary.id).catch(console.error);

    // 5. Return the summary ID immediately
    return NextResponse.json({ 
      success: true,
      summaryId: summary.id
    });
    
  } catch (error) {
    console.error("Summary creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Function to process the summary in the background
async function processSummary(summaryId: string) {
  try {
    // 1. Update summary status to processing
    await prisma.summary.update({
      where: { id: summaryId },
      data: { summary_content: "processing" },
    });

    // 2. Get the summary details
    const summary = await prisma.summary.findUnique({
      where: { id: summaryId },
    });

    if (!summary) {
      console.error(`processSummary error: Summary with ID ${summaryId} not found after setting status to processing.`);
      throw new Error("Summary not found");
    }

    console.log(`processSummary: Sending request to n8n for summary ID ${summaryId} and URL ${summary.youtube_url}`);
    // 3. Send the YouTube URL to the n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ youtubeUrl: summary.youtube_url }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`processSummary error: N8N webhook returned non-OK status ${response.status}: ${errorText}`);
      throw new Error(`N8N API error: ${errorText}`);
    }

    console.log(`processSummary: Received OK response from n8n for summary ID ${summaryId}. Processing response.`);
    // 4. Get the summary data from the n8n response
    let summaryContent = '';
    const rawResponseBody = await response.text();
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      try {
        const summaryData = JSON.parse(rawResponseBody);
        summaryContent = summaryData.cleanedHtml || summaryData.summary || summaryData.text || summaryData.result || summaryData.content;
        console.log(`processSummary: Successfully parsed JSON response for summary ID ${summaryId}. Content length: ${summaryContent.length}`);
      } catch (parseError) {
        console.error(`processSummary error: Failed to parse JSON response for summary ID ${summaryId}: ${parseError}`);
        // Fallback to raw text if JSON parsing fails
        summaryContent = rawResponseBody;
      }
    } else {
      summaryContent = rawResponseBody;
      console.log(`processSummary: Received non-JSON response for summary ID ${summaryId}. Using raw text. Content length: ${summaryContent.length}`);
    }

    if (!summaryContent || summaryContent.trim() === '') {
      console.error(`processSummary error: Received empty summary content from webhook for summary ID ${summaryId}`);
      throw new Error("Received empty summary from webhook");
    }

    // 5. Update summary with the content
    await prisma.summary.update({
      where: { id: summaryId },
      data: {
        summary_content: summaryContent,
      },
    });
    console.log(`processSummary: Successfully updated summary ID ${summaryId} with content.`);

  } catch (error) {
    console.error("Job processing error for summary ID " + summaryId + ":", error);
    // Update summary status to failed
    await prisma.summary.update({
      where: { id: summaryId },
      data: {
        summary_content: `Error: ${error instanceof Error ? error.message : "An unexpected error occurred"}`,
      },
    });
    console.error(`processSummary: Marked summary ID ${summaryId} as failed due to error.`);
  }
} 