import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/utils/supabase/server";
import { nanoid } from 'nanoid';
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

    // 3. Create a new job in the database
    const job = await prisma.summary.create({
      data: {
        user_id: userId,
        youtube_url: youtubeUrl,
        summary_content: "",
      },
    });

    // 4. Start the summarization process in the background
    processJob(job.id).catch(console.error);

    // 5. Return the job ID immediately
    return NextResponse.json({ 
      success: true,
      jobId: job.id,
      status: "pending"
    });
    
  } catch (error) {
    console.error("Job creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Function to process the job in the background
async function processJob(jobId: string) {
  try {
    // 1. Update job status to processing
    await prisma.summary.update({
      where: { id: jobId },
      data: { summary_content: "processing" },
    });

    // 2. Get the job details
    const job = await prisma.summary.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    // 3. Send the YouTube URL to the n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ youtubeUrl: job.youtube_url }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`N8N API error: ${errorText}`);
    }

    // 4. Get the summary data from the n8n response
    let summaryContent = '';
    const rawResponseBody = await response.text();
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      const summaryData = JSON.parse(rawResponseBody);
      summaryContent = summaryData.cleanedHtml || summaryData.summary || summaryData.text || summaryData.result || summaryData.content;
    } else {
      summaryContent = rawResponseBody;
    }

    if (!summaryContent || summaryContent.trim() === '') {
      throw new Error("Received empty summary from webhook");
    }

    // 5. Initialize Supabase client
    const supabase = await createClient();
    
    // 6. Store the summary in the database
    const { data: summary, error } = await supabase
      .from("summaries")
      .insert({
        id: nanoid(),
        user_id: job.user_id,
        youtube_url: job.youtube_url,
        summary_content: summaryContent,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save summary: ${error.message}`);
    }

    // 7. Update job status to completed
    await prisma.summary.update({
      where: { id: jobId },
      data: {
        summary_content: summaryContent,
      },
    });

  } catch (error) {
    console.error("Job processing error:", error);
    // Update job status to failed
    await prisma.summary.update({
      where: { id: jobId },
      data: {
        summary_content: `Error: ${error instanceof Error ? error.message : "An unexpected error occurred"}`,
      },
    });
  }
} 