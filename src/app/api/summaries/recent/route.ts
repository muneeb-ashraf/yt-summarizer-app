import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  console.log("Received request for recent summaries.");
  try {
    // 1. Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      console.log("Unauthorized request for recent summaries.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`Authenticated user: ${userId}`);

    // 2. Fetch recent summaries for this user using Prisma
    const summaries = await prisma.summary.findMany({
      where: {
        user_id: userId, // Filter by user ID
      },
      orderBy: {
        created_at: 'desc', // Order by creation date, descending
      },
      take: 5, // Limit to the 5 most recent
    });

    console.log(`Fetched ${summaries.length} recent summaries for user ${userId}.`);

    // 3. Return the summaries
    console.log("Returning recent summaries.");
    return NextResponse.json({ summaries });
    
  } catch (error) {
    console.error("Error in recent summaries API route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 