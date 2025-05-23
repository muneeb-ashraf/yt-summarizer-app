"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PLANS, StripeProduct } from "@/utils/plans";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

interface UserCredits {
  plan: string;
  summariesLeft: number;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
  subscriptionId: string | null;
}

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { userId } = useAuth();

  // Fetch user credits and subscription status
  const fetchUserCredits = async () => {
    if (!userId) return;
    
    try {
      setIsLoadingCredits(true);
      const response = await fetch('/api/user/credits');
      if (!response.ok) {
        throw new Error('Failed to fetch user credits');
      }
      const data = await response.json();
      setUserCredits(data);
    } catch (error) {
      console.error('Error fetching user credits:', error);
      toast({
        title: "Error",
        content: "Failed to load subscription status",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCredits(false);
    }
  };

  // Fetch credits on mount and when returning from Stripe
  useEffect(() => {
    fetchUserCredits();

    // Check for success/canceled parameters from Stripe redirect
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast({
        title: "Success",
        content: "Your subscription has been updated!",
      });
      fetchUserCredits(); // Refresh credits after successful subscription
    } else if (canceled === 'true') {
      toast({
        title: "Canceled",
        content: "Subscription process was canceled",
      });
    }
  }, [userId, searchParams]);

  const handleSubscribe = async (priceId: string) => {
    try {
      setLoading(priceId);
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      if (url) {
        router.push(url);
      }
    } catch (_error) {
      toast({
        title: "Error",
        content: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!userCredits?.stripeCustomerId) {
      toast({
        title: "Error",
        content: "No active subscription found",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading("manage");
      const response = await fetch("/api/stripe/create-portal", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const { url } = await response.json();
      if (url) {
        router.push(url);
      }
    } catch (_error) {
      toast({
        title: "Error",
        content: "Failed to access billing portal",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  // Get current plan details
  const currentPlan = userCredits ? PLANS.find(p => p.id === userCredits.plan) : null;
  const isSubscribed = userCredits?.subscriptionStatus === 'active';

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Subscription Plans</h1>
      
      {/* Current Plan Status */}
      <div className="mb-8 p-6 bg-card rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Current Plan Status</h2>
        {isLoadingCredits ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading subscription status...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Current Plan</h3>
              <p className="text-2xl font-bold mt-1">{currentPlan?.name || 'Free'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Available Credits</h3>
              <p className="text-2xl font-bold mt-1">
                {userCredits?.summariesLeft ?? 0} / {currentPlan?.summariesLimit ?? 3}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Subscription Status</h3>
              <p className="text-2xl font-bold mt-1 capitalize">
                {userCredits?.subscriptionStatus || 'Free'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan: StripeProduct) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col ${
              currentPlan?.id === plan.id ? 'border-primary' : ''
            }`}
          >
      <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
            <CardContent className="flex-grow">
              <div className="text-3xl font-bold mb-4">
                ${plan.price}
                <span className="text-sm font-normal text-muted-foreground">
                  /month
                </span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center">
                    <span className="mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id || (currentPlan?.id === plan.id && isSubscribed)}
                variant={currentPlan?.id === plan.id ? "outline" : "default"}
              >
                {loading === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : currentPlan?.id === plan.id ? (
                  isSubscribed ? "Current Plan" : "Subscribe"
                ) : (
                  "Subscribe"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {isSubscribed && (
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleManageSubscription}
            disabled={loading === "manage"}
            variant="outline"
          >
            {loading === "manage" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Manage Subscription"
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 