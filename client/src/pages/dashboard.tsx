import { useState } from "react";
import { NavSidebar } from "@/components/nav-sidebar";
import { SummaryCreator } from "@/components/summary-creator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useSummaries } from "@/hooks/use-summary";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user } = useUser();
  const { summaries, isLoading } = useSummaries();
  const [selectedSummaryId, setSelectedSummaryId] = useState<number | null>(null);

  const selectedSummary = summaries?.find(s => s.id === selectedSummaryId);
  const summaryCount = summaries?.length || 0;

  const availableCredits = user?.subscription === 'free' 
    ? Math.max(5 - summaryCount, 0)
    : 'Unlimited';

  return (
    <div className="flex h-screen bg-background">
      <NavSidebar />

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Welcome, {user?.username}</h1>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Summaries Created</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : summaryCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold capitalize">{user?.subscription}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Available Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {availableCredits}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Create New Summary</h2>
              <SummaryCreator />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Recent Summaries</h2>
              {isLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : summaries?.length === 0 ? (
                <p className="text-muted-foreground">No summaries yet</p>
              ) : (
                <div className="space-y-4">
                  {summaries?.map(summary => (
                    <Card
                      key={summary.id}
                      className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 ${
                        selectedSummaryId === summary.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedSummaryId(summary.id)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{summary.videoTitle}</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Format: <span className="capitalize">{summary.format}</span></p>
                          <p>Language: <span className="capitalize">{summary.language}</span></p>
                          <p>Created: {new Date(summary.createdAt).toLocaleDateString()}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedSummary && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>{selectedSummary.videoTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{selectedSummary.summary}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}