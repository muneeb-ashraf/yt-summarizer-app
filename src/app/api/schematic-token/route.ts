import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs";
import { SchematicClient } from "@schematichq/schematic-js";

export async function GET() {
  try {
    const { userId, orgId } = auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!orgId) {
      return NextResponse.json(
        { error: "Organization context required for billing" },
        { status: 400 }
      );
    }

    const apiKey = process.env.SCHEMATIC_SECRET_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const schematicClient = new SchematicClient({ apiKey });
    const resp = await schematicClient.accesstokens.issueTemporaryAccessToken({
      resourceType: "company",
      lookup: {
        clerkId: orgId,
      },
    });
    
    const accessToken = resp.data?.token;
    
    if (!accessToken) {
      return NextResponse.json({ error: "Failed to generate access token" }, { status: 500 });
    }

    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error("Error generating Schematic access token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 