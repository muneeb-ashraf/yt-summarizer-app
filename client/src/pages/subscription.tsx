import { NavSidebar } from "../components/nav-sidebar";
import { useUser } from "../hooks/use-user";
import SubscriptionCard from "../components/subscription-card";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Subscription() {
  const { user } = useUser();

  const plans = [
    {
      title: "Free",
      price: 0,
      features: [
        "5 summaries per month",
        "15 minute video limit",
        "Basic summarization",
        "Single language"
      ]
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
      highlighted: true
    },
    {
      title: "Enterprise",
      price: 25,
      features: [
        "All Pro features",
        "Team accounts (5 users)",
        "Multiple languages",
        "Priority support"
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-background">
      <NavSidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Subscription Plans</h1>

          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Subscription Management Coming Soon</AlertTitle>
            <AlertDescription>
              Subscription management is currently being set up. You'll be able to upgrade your plan soon!
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <SubscriptionCard
                key={index}
                {...plan}
                highlighted={plan.title.toLowerCase() === user?.subscription}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
