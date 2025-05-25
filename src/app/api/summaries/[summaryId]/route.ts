import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { summaryId: string } }) {
  console.log("Received request for single summary by ID.");
  try {
    // 1. Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      console.log("Unauthorized request for single summary.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`Authenticated user: ${userId}`);

    // 2. Get summary ID from request parameters
    const summaryId = params.summaryId;
    if (!summaryId) {
      console.log("Missing summary ID in request parameters.");
      return NextResponse.json({ error: "Summary ID is required" }, { status: 400 });
    }
    console.log(`Fetching summary with ID: ${summaryId}`);

    // 3. Fetch summary from database using Prisma
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
    console.log(`Found summary with ID ${summaryId}.`);

    // 4. Return the summary
    console.log(`Returning summary with ID ${summaryId}.`);
    return NextResponse.json({ summary });
    
  } catch (error) {
    console.error("Error in get summary by ID API route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 