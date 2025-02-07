import { useState } from "react";
import { NavSidebar } from "../components/nav-sidebar";
import { SummaryCreator } from "../components/summary-creator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { useUser } from "../hooks/use-user";
import { useSummaries } from "../hooks/use-summary";
import { Loader2, Download, ExternalLink, Clock, Layout } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";

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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Welcome, {user?.username}</h1>
          </div>

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
                          className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 ${
                            selectedSummaryId === summary.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setSelectedSummaryId(summary.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold line-clamp-2">{summary.videoTitle}</h3>
                              <a
                                href={`https://youtube.com/watch?v=${summary.videoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground ml-2 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
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
                              {new Date(summary.createdAt).toLocaleDateString()}
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

          {selectedSummary && (
            <Card className="mt-8">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle>{selectedSummary.videoTitle}</CardTitle>
                  <CardDescription>
                    Generated on {new Date(selectedSummary.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  const blob = new Blob([selectedSummary.summary], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `summary-${selectedSummary.videoId}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none">
                  {selectedSummary.format === 'bullets' ? (
                    <div dangerouslySetInnerHTML={{ 
                      __html: selectedSummary.summary
                        .split('\n')
                        .filter(line => line.trim())
                        .map(line => `<p>${line}</p>`)
                        .join('')
                    }} />
                  ) : (
                    <div className="whitespace-pre-wrap">{selectedSummary.summary}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}