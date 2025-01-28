import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiYoutube } from "react-icons/si";
import SubscriptionCard from "@/components/subscription-card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SiYoutube className="h-6 w-6 text-red-500" />
            <span className="font-bold text-xl">YouTube AI Summarizer</span>
          </div>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Summarize YouTube Videos with AI
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Get instant AI-powered summaries of any YouTube video. Save time and
            extract key insights effortlessly.
          </p>
          <Link href="/dashboard">
            <Button size="lg">Try it Now</Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardContent className="p-6">
              <img
                src="https://images.unsplash.com/photo-1708063785687-53f175935774"
                alt="Dashboard"
                className="rounded-lg mb-4"
              />
              <h2 className="text-xl font-semibold mb-2">Modern Dashboard</h2>
              <p className="text-muted-foreground">
                Track your summaries and manage your account with our intuitive
                dashboard interface.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <img
                src="https://images.unsplash.com/photo-1501504905252-473c47e087f8"
                alt="Content Creation"
                className="rounded-lg mb-4"
              />
              <h2 className="text-xl font-semibold mb-2">Smart Summaries</h2>
              <p className="text-muted-foreground">
                Get intelligent summaries powered by advanced AI technology.
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="py-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            Choose Your Plan
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <SubscriptionCard
              title="Free"
              price={0}
              features={[
                "5 summaries per month",
                "15 minute video limit",
                "Basic summarization",
                "Single language"
              ]}
            />
            <SubscriptionCard
              title="Pro"
              price={10}
              features={[
                "Unlimited summaries",
                "2 hour video limit",
                "Multiple summary formats",
                "PDF/Word export"
              ]}
              highlighted
            />
            <SubscriptionCard
              title="Enterprise"
              price={25}
              features={[
                "All Pro features",
                "Team accounts (5 users)",
                "Multiple languages",
                "Priority support"
              ]}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
