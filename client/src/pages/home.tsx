import { Link } from "wouter";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { SiYoutube, SiGoogle, SiGithub, SiApple } from "react-icons/si";
import SubscriptionCard from "../components/subscription-card";
import { Separator } from "../components/ui/separator";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SiYoutube className="h-6 w-6 text-red-500" />
            <span className="font-bold text-xl">YouTube AI Summarizer</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth?register=true">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              Summarize YouTube Videos with AI
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Get instant AI-powered summaries of any YouTube video. Save time and
              extract key insights effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth?register=true">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-8 text-muted-foreground">
              <SiGoogle className="h-8 w-8" />
              <SiGithub className="h-8 w-8" />
              <SiApple className="h-8 w-8" />
              <span className="text-lg font-semibold">Sign in with your favorite platform</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Powerful Features
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="rounded-lg p-2 bg-primary/10 w-fit mb-4">
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Fast & Accurate</h3>
                  <p className="text-muted-foreground">
                    Get summaries in seconds with our advanced AI technology
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="rounded-lg p-2 bg-primary/10 w-fit mb-4">
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Multiple Languages</h3>
                  <p className="text-muted-foreground">
                    Get summaries in your preferred language
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="rounded-lg p-2 bg-primary/10 w-fit mb-4">
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Flexible Formats</h3>
                  <p className="text-muted-foreground">
                    Choose from multiple summary formats
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Separator />

        {/* Pricing */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Simple, Transparent Pricing
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-muted py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <SiYoutube className="h-6 w-6 text-red-500" />
                <span className="font-bold text-xl">YouTube AI Summarizer</span>
              </div>
              <div className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} YouTube AI Summarizer. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}