"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BillingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId, orgId } = useAuth();
  const router = useRouter();

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

        // Placeholder: Removed Schematic token fetch
        // If you need to fetch other plan data, do it here.

      } catch (err) {
        console.error("Error fetching access token:", err);
        setError(err instanceof Error ? err.message : "Failed to load billing information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccessToken();
  }, [userId, orgId, router]);

  return (
    <div className="container mx-auto py-10">
      <div className="p-6 bg-card rounded-lg border">
        <h1 className="text-3xl font-bold mb-6">Manage Plan</h1>
        
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
        
        {!isLoading && !error && (
         <div className="p-4 border rounded-md bg-muted text-muted-foreground">
           Plan management is currently unavailable.
         </div>
        )}
      </div>
    </div>
  );
}