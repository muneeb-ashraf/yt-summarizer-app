import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  console.log("Received request for summary status.");
  try {
    // 1. Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      console.log("Unauthorized request for summary status.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`Authenticated user: ${userId}`);

    // 2. Get summary ID from request URL
    const summaryId = request.nextUrl.searchParams.get("summaryId");
    if (!summaryId) {
      console.log("Missing summary ID in request for summary status.");
      return NextResponse.json({ error: "Summary ID is required" }, { status: 400 });
    }
    console.log(`Checking status for summary ID: ${summaryId}`);

    // 3. Get summary from database
    const summary = await prisma.summary.findUnique({
      where: { 
        id: summaryId,
        user_id: userId, // Ensure the summary belongs to the user
      },
    });

    if (!summary) {
      console.log(`Summary with ID ${summaryId} not found for user ${userId}.`);
      return NextResponse.json({ error: "Summary not found" }, { status: 404 });
    }
    console.log(`Found summary with ID ${summaryId}. Content snippet: ${summary.summary_content.substring(0, 50)}...`);

    // 4. Determine status from summary_content
    let status: 'pending' | 'processing' | 'completed' | 'failed' = 'completed';
    let error: string | undefined;

    if (summary.summary_content === 'pending') {
      status = 'pending';
    } else if (summary.summary_content === 'processing') {
      status = 'processing';
    } else if (summary.summary_content.startsWith('Error:')) {
      status = 'failed';
      error = summary.summary_content.substring(6).trim(); // Remove 'Error:' prefix
    }
    console.log(`Determined status for summary ID ${summaryId}: ${status}`);
    if (error) {
      console.error(`Error message for failed summary ID ${summaryId}: ${error}`);
    }

    // 5. Return summary status
    console.log(`Returning status for summary ID ${summaryId}.`);
    return NextResponse.json({
      status,
      error,
      summaryId: summary.id,
      createdAt: summary.created_at,
      completedAt: status === 'completed' ? summary.created_at : undefined,
    });
    
  } catch (error) {
    console.error("Error in job-status API route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 