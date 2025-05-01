"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillingPage() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Billing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 border rounded-md bg-muted text-muted-foreground">
          Billing information is currently unavailable.
        </div>
      </CardContent>
    </Card>
  );
} 