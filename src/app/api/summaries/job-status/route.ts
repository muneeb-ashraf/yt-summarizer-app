import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // 1. Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get job ID from request URL
    const jobId = request.nextUrl.searchParams.get("jobId");
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    // 3. Get job status from database
    const job = await prisma.summaryJob.findUnique({
      where: { 
        id: jobId,
        userId, // Ensure the job belongs to the user
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 4. Return job status
    return NextResponse.json({
      status: job.status,
      error: job.error,
      summaryId: job.summaryId,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    });
    
  } catch (error) {
    console.error("Error checking job status:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 