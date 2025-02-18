import { NavSidebar } from "../components/nav-sidebar";
import { useUser } from "../hooks/use-user";
import SubscriptionCard from "../components/subscription-card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function Subscription() {
  const { user, refetchUser } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: string) => {
    try {
      setIsLoading(plan);
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const plans = [
    {
      title: "Free",
      price: 0,
      features: [
        "5 summaries per month",
        "15 minute video limit",
        "Basic summarization",
        "Single language"
      ],
      action: null
    },
    {
      title: "Pro",
      price: 10,
      features: [
        "Unlimited summaries",
        "2 hour video limit",
        "Multiple summary formats",
        "PDF/Word export"
      ],
      highlighted: true,
      action: () => handleSubscribe('pro')
    },
    {
      title: "Enterprise",
      price: 25,
      features: [
        "All Pro features",
        "Team accounts (5 users)",
        "Multiple languages",
        "Priority support"
      ],
      action: () => handleSubscribe('enterprise')
    }
  ];

  // Helper function to determine if a plan is upgradeable
  const isUpgradeable = (planTitle: string) => {
    const planOrder = { free: 0, pro: 1, enterprise: 2 };
    const currentLevel = planOrder[user?.subscription?.toLowerCase() as keyof typeof planOrder] || 0;
    const targetLevel = planOrder[planTitle.toLowerCase() as keyof typeof planOrder];
    return targetLevel > currentLevel;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      <NavSidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Subscription Plans</h1>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const planLower = plan.title.toLowerCase();
              const isCurrentPlan = planLower === user?.subscription?.toLowerCase();
              const canUpgrade = isUpgradeable(plan.title);

              return (
                <SubscriptionCard
                  key={index}
                  {...plan}
                  buttonDisabled={isLoading !== null}
                  isLoading={isLoading === planLower}
                  highlighted={isCurrentPlan}
                  showSubscribeButton={plan.title.toLowerCase() !== 'free' && (isCurrentPlan || canUpgrade)}
                  currentPlan={user?.subscription}
                  buttonText={isCurrentPlan ? 'Current Plan' : canUpgrade ? 'Upgrade' : undefined}
                />
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}