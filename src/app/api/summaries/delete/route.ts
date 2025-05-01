import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/utils/supabase/server";

export async function DELETE(request: NextRequest) {
  try {
    // 1. Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get summary ID from request URL
    const summaryId = request.nextUrl.searchParams.get("id");
    if (!summaryId) {
      return NextResponse.json({ error: "Summary ID is required" }, { status: 400 });
    }

    // 3. Initialize Supabase client
    const supabase = await createClient();
    
    // 4. First verify that the summary belongs to this user
    const { data: summary, error: fetchError } = await supabase
      .from("summaries")
      .select("id")
      .eq("id", summaryId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !summary) {
      return NextResponse.json(
        { error: "Summary not found or not authorized" },
        { status: 404 }
      );
    }

    // 5. Delete the summary
    const { error: deleteError } = await supabase
      .from("summaries")
      .delete()
      .eq("id", summaryId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete summary" },
        { status: 500 }
      );
    }

    // 6. Return success response
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error deleting summary:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 