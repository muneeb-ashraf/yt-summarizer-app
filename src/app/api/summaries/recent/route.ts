import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    // 1. Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Initialize Supabase client
    const supabase = await createClient();
    
    // 3. Fetch recent summaries for this user
    const { data: summaries, error } = await supabase
      .from("summaries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch summaries" },
        { status: 500 }
      );
    }

    // 4. Return the summaries
    return NextResponse.json({ summaries });
    
  } catch (error) {
    console.error("Error fetching summaries:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 