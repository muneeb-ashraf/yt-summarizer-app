
import { Link } from "wouter";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { SiYoutube, SiGoogle, SiGithub, SiApple } from "react-icons/si";
import { Brain, Zap, Globe, List, Book, Pen, Headphones, Briefcase, Star, Link as LinkIcon, Wand2 } from "lucide-react";
import SubscriptionCard from "../components/subscription-card";
import { motion } from "framer-motion";

export default function Home() {
  const handleTryNow = () => {
    window.location.href = "/auth?register=true";
  };

  // Hero Section Component
  const Hero = () => (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="relative z-10 text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent"
        >
          Summarize YouTube Videos with AI
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl mb-8 text-muted-foreground"
        >
          Get instant AI-powered summaries of any YouTube video. Save time and extract key insights effortlessly.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/auth?register=true">
            <Button size="lg" className="w-full sm:w-auto">
              Try Now
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Learn More
            </Button>
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-muted-foreground"
        >
          <div>🚀 Used by 10,000+ professionals</div>
          <div>⭐ AI-powered accuracy</div>
          <div>🔒 Secure & reliable</div>
        </motion.div>
      </div>
    </section>
  );

  // How It Works Component
  const HowItWorks = () => {
    const steps = [
      {
        icon: <LinkIcon className="w-12 h-12 text-primary" />,
        title: "Paste the YouTube Link",
        description: "Copy any video URL",
      },
      {
        icon: <Wand2 className="w-12 h-12 text-primary" />,
        title: "Choose Summary Type",
        description: "Bullet points, short paragraphs, key takeaways",
      },
      {
        icon: <Zap className="w-12 h-12 text-primary" />,
        title: "Get Instant Summary",
        description: "AI-powered output in seconds",
      },
    ];

    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="mb-4 flex justify-center">{step.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // Features Component
  const Features = () => {
    const features = [
      {
        icon: <Brain className="w-12 h-12 text-primary" />,
        title: "Fast & Accurate",
        description: "Get summaries in seconds with our advanced AI technology",
      },
      {
        icon: <Globe className="w-12 h-12 text-primary" />,
        title: "Multiple Languages",
        description: "Get summaries in your preferred language",
      },
      {
        icon: <List className="w-12 h-12 text-primary" />,
        title: "Flexible Formats",
        description: "Choose from multiple summary formats",
      },
    ];

    return (
      <section id="features" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="rounded-lg p-2 bg-primary/10 w-fit mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // Use Cases Component
  const UseCases = () => {
    const useCases = [
      {
        icon: <Book className="w-12 h-12 text-primary" />,
        title: "Students & Researchers",
        description: "Summarize educational videos",
      },
      {
        icon: <Pen className="w-12 h-12 text-primary" />,
        title: "Content Creators",
        description: "Quickly extract key points",
      },
      {
        icon: <Headphones className="w-12 h-12 text-primary" />,
        title: "Podcast Listeners",
        description: "Save time on long content",
      },
      {
        icon: <Briefcase className="w-12 h-12 text-primary" />,
        title: "Professionals",
        description: "Extract insights from webinars",
      },
    ];

    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Perfect for Everyone</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="mb-4 flex justify-center">{useCase.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{useCase.title}</h3>
                <p className="text-muted-foreground">{useCase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // Pricing Section (using your existing SubscriptionCard component)
  const Pricing = () => (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
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
  );

  // FAQ Component
  const FAQ = () => {
    const faqs = [
      {
        question: "How does the summarizer work?",
        answer: "Our AI-powered summarizer uses advanced natural language processing to analyze YouTube videos and extract key information. It then generates concise summaries in various formats to suit your needs.",
      },
      {
        question: "Is there a free trial?",
        answer: "Yes! Our Basic plan offers 5 free summaries per month, allowing you to try out our service without any commitment.",
      },
      {
        question: "Can I summarize non-English videos?",
        answer: "Our Pro and Enterprise plans support multiple languages. Simply paste the YouTube link, and we'll detect the language automatically.",
      },
      {
        question: "Do you offer refunds?",
        answer: "We offer a 30-day money-back guarantee for our paid plans. If you're not satisfied with our service, please contact our support team.",
      },
    ];

    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible>
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    );
  };

  // Final CTA Component
  const CTA = () => (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-8">Start Summarizing Today</h2>
        <Link href="/auth?register=true">
          <Button size="lg" variant="secondary">
            Try Now for Free
          </Button>
        </Link>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Your existing Navigation */}
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
        <Hero />
        <HowItWorks />
        <Features />
        <Pricing />
        <UseCases />
        <FAQ />
        <CTA />
      </main>

      {/* Your existing Footer */}
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
    </div>
  );
}
