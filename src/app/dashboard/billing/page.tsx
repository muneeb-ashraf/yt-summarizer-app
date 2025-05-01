"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@clerk/nextjs";
import { SchematicEmbed } from "@schematichq/schematic-components";

export default function BillingPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const componentId = process.env.NEXT_PUBLIC_SCHEMATIC_COMPONENT_ID_FOR_BILLING;

  useEffect(() => {
    const fetchToken = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/schematic");
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch access token");
        }
        
        const data = await response.json();
        setAccessToken(data.accessToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        console.error("Error fetching Schematic token:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-md bg-red-50 text-red-700">
            Error loading billing information: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!accessToken || !componentId) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-md bg-yellow-50 text-yellow-700">
            Unable to load billing component. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Billing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full min-h-[500px]">
          <SchematicEmbed 
            accessToken={accessToken} 
            id={componentId} 
          />
        </div>
      </CardContent>
    </Card>
  );
} 