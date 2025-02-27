import { useState, useEffect } from "react";
import { NavSidebar } from "../components/nav-sidebar";
import { SummaryCreator } from "../components/summary-creator";
import { SummaryModal } from "../components/summary-modal";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useUser } from "../hooks/use-user";
import { useSummaries, useDeleteSummary } from "../hooks/use-summary";
import { Loader2, ExternalLink, Clock, Layout, Trash2 } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Button } from "../components/ui/button";
import { Toaster } from "../components/ui/toaster";
import { useToast } from "../hooks/use-toast";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import type { Summary } from "../lib/supabase";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, refetchUser } = useUser();
  const { summaries, isLoading, refetch: refetchSummaries } = useSummaries();
  const { deleteSummary } = useDeleteSummary();
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(null);
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);
  const queryClient = useQueryClient();
  const [, params] = useLocation();

  const selectedSummary = summaries?.find(s => s.id === selectedSummaryId);
  const summaryCount = summaries?.length || 0;

  // Calculate available credits based on subscription type
  const getAvailableCredits = () => {
    if (!user) return 0;
    const subscriptionType = user.subscription?.toLowerCase();
    if (subscriptionType === 'pro' || subscriptionType === 'enterprise') {
      return 'Unlimited';
    }
    return Math.max(5 - summaryCount, 0);
  };

  const availableCredits = getAvailableCredits();

  // Handle Stripe success
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get('session_id');

    if (sessionId) {
      // Clear the URL parameters
      window.history.replaceState({}, '', '/dashboard');
      setIsUpdatingSubscription(true);

      const updateSubscriptionStatus = async () => {
        try {
          // Add longer delay to ensure webhook processing
          await new Promise(resolve => setTimeout(resolve, 5000));

          // Refresh user data and summaries
          await Promise.all([
            refetchUser(),
            refetchSummaries()
          ]);

          const currentUser = queryClient.getQueryData(['user']);

          if (currentUser?.subscription === 'pro' || currentUser?.subscription === 'enterprise') {
            toast({
              title: "Subscription Updated",
              description: "Your subscription has been successfully updated. Enjoy your new features!",
            });
          } else {
            throw new Error('Subscription update not reflected yet');
          }
        } catch (error) {
          console.error('Error updating subscription status:', error);
          toast({
            title: "Update Error",
            description: "There was an error updating your subscription status. Please refresh the page.",
            variant: "destructive",
          });
        } finally {
          setIsUpdatingSubscription(false);
        }
      };

      updateSubscriptionStatus();
    }
  }, [refetchUser, refetchSummaries, toast, queryClient]);

  useEffect(() => {
    if (availableCredits === 0 && user?.subscription === 'free') {
      toast({
        title: "No Available Credits",
        description: "You've used all your available credits. Please upgrade your plan to continue.",
        variant: "destructive",
      });
    }
  }, [availableCredits, user?.subscription]);

  const handleDeleteSummary = async (id: string) => {
    try {
      await deleteSummary(id);
      setSelectedSummaryId(null);
    } catch (error) {
      console.error("Error deleting summary:", error);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      <NavSidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-4 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">Welcome, {user?.username}</h1>
          </div>

          {isUpdatingSubscription && (
            <div className="mb-4 p-4 bg-muted rounded-lg flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Updating subscription status...</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Summaries Created</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl md:text-3xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : summaryCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl md:text-3xl font-bold capitalize">
                  {user?.subscription || 'Free'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Available Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl md:text-3xl font-bold">{availableCredits}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold">Create New Summary</h2>
              <SummaryCreator />
            </div>
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold">Recent Summaries</h2>
              <Card className="h-[calc(100vh-20rem)]">
                <ScrollArea className="h-full">
                  {isLoading ? (
                    <div className="flex justify-center p-6">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : summaries?.length === 0 ? (
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No summaries yet</p>
                      <p className="text-sm mt-1">Create your first summary to get started</p>
                    </CardContent>
                  ) : (
                    <div className="space-y-4 p-4">
                      {summaries?.map(summary => (
                        <Card
                          key={summary.id}
                          className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/20`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div
                                className="flex-1"
                                onClick={() => setSelectedSummaryId(summary.id)}
                              >
                                <h3 className="font-semibold line-clamp-2">
                                  {summary.video_title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                <a
                                  href={`https://youtube.com/watch?v=${summary.video_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-foreground"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSummary(summary.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant="secondary" className="capitalize">
                                {summary.format}
                              </Badge>
                              <Badge variant="secondary" className="capitalize">
                                {summary.language}
                              </Badge>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(summary.created_at).toLocaleString()}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </div>
          </div>

          <SummaryModal
            summary={selectedSummary}
            videoTitle={selectedSummary?.video_title || ""}
            isOpen={!!selectedSummaryId}
            onClose={() => setSelectedSummaryId(null)}
            onDelete={handleDeleteSummary}
          />
        </div>
      </main>
      <Toaster />
    </div>
  );
}