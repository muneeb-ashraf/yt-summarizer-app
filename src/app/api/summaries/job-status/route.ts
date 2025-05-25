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

    // 2. Get summary ID from request URL
    const summaryId = request.nextUrl.searchParams.get("summaryId");
    if (!summaryId) {
      return NextResponse.json({ error: "Summary ID is required" }, { status: 400 });
    }

    // 3. Get summary from database
    const summary = await prisma.summary.findUnique({
      where: { 
        id: summaryId,
        user_id: userId, // Ensure the summary belongs to the user
      },
    });

    if (!summary) {
      return NextResponse.json({ error: "Summary not found" }, { status: 404 });
    }

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

    // 5. Return summary status
    return NextResponse.json({
      status,
      error,
      summaryId: summary.id,
      createdAt: summary.created_at,
      completedAt: status === 'completed' ? summary.created_at : undefined,
    });
    
  } catch (error) {
    console.error("Error checking summary status:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 