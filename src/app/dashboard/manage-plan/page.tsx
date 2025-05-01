"use client";

import { useEffect, useState } from "react";
import { SchematicEmbed } from "@schematichq/schematic-components";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function BillingPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId, orgId } = useAuth();
  const router = useRouter();

  // Get the component ID from the environment variable
  const componentId = process.env.NEXT_PUBLIC_SCHEMATIC_COMPONENT_ID_FOR_BILLING;

  useEffect(() => {
    const fetchAccessToken = async () => {
      try {
        setIsLoading(true);
        
        // Redirect if user is not authenticated
        if (!userId) {
          router.push("/sign-in");
          return;
        }
        
        // Check if organization is selected
        if (!orgId) {
          setError("Please select an organization to manage billing.");
          setIsLoading(false);
          return;
        }

        // Fetch access token from our API
        const response = await fetch("/api/schematic-token");
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch access token");
        }
        
        const data = await response.json();
        setAccessToken(data.accessToken);
      } catch (err) {
        console.error("Error fetching access token:", err);
        setError(err instanceof Error ? err.message : "Failed to load billing information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccessToken();
  }, [userId, orgId, router]);

  if (!componentId) {
    return (
      <div className="container mx-auto py-10">
        <div className="p-6 bg-card rounded-lg border">
          <h1 className="text-3xl font-bold mb-6">Billing</h1>
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
            Schematic component ID not configured. Please add NEXT_PUBLIC_SCHEMATIC_COMPONENT_ID_FOR_BILLING to your environment variables.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="p-6 bg-card rounded-lg border">
        <h1 className="text-3xl font-bold mb-6">Billing</h1>
        
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
            {error}
          </div>
        )}
        
        {!isLoading && !error && accessToken && (
          <div className="h-[600px] w-full">
            <SchematicEmbed 
              accessToken={accessToken} 
              id={componentId} 
            />
          </div>
        )}
      </div>
    </div>
  );
}