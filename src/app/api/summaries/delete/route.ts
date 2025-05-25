import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  console.log("Received request to delete summary.");
  let userId: string | null = null;
  let summaryId: string | null = null;

  try {
    // 1. Get authenticated user
    const authResult = await auth();
    userId = authResult.userId;
    
    if (!userId) {
      console.log("Unauthorized request for summary deletion.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`Authenticated user: ${userId}`);

    // 2. Get summary ID from request URL
    summaryId = request.nextUrl.searchParams.get("id");
    if (!summaryId) {
      console.log("Missing summary ID in request for summary deletion.");
      return NextResponse.json({ error: "Summary ID is required" }, { status: 400 });
    }
    console.log(`Attempting to delete summary with ID: ${summaryId}`);

    // 3. Delete the summary using Prisma, ensuring it belongs to the user
    console.log(`Deleting summary with ID ${summaryId} for user ${userId} from database.`);
    const _deleteResult = await prisma.summary.delete({
      where: {
        id: summaryId,
        user_id: userId, // Ensure the summary belongs to the user
      },
    });

    console.log(`Successfully deleted summary with ID ${summaryId}.`);

    // 4. Return success response
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error in delete summary API route:", error);

    // Check if the error is due to the summary not being found (P2025)
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
        console.log(`Summary with ID ${summaryId} not found or not owned by user ${userId}.`);
        return NextResponse.json(
            { error: "Summary not found or not authorized" },
            { status: 404 }
        );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 