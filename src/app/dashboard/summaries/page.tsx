"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Summary {
  id: string;
  youtube_url: string;
  summary_content: string;
  created_at: string;
  title?: string;
}

export default function Page() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const summaryId = searchParams.get("id");

  useEffect(() => {
    fetchSummaries();
  }, []);

  useEffect(() => {
    if (summaryId && summaries.length > 0) {
      const summary = summaries.find(s => s.id === summaryId);
      setSelectedSummary(summary || null);
    }
  }, [summaryId, summaries]);

  const fetchSummaries = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/summaries/all");
      
      if (!response.ok) {
        throw new Error("Failed to fetch summaries");
      }
      
      const data = await response.json();
      setSummaries(data.summaries || []);
    } catch (error) {
      console.error("Error fetching summaries:", error);
      toast.error("Failed to load summaries");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSummary = async (id: string) => {
    if (!confirm("Are you sure you want to delete this summary?")) return;
    
    setDeletingId(id);
    try {
      const response = await fetch(`/api/summaries/delete?id=${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete summary");
      }
      
      setSummaries(currentSummaries => currentSummaries.filter(s => s.id !== id));
      if (selectedSummary?.id === id) {
        setSelectedSummary(null);
      }
      
      toast.success("Summary deleted successfully");
    } catch (error: unknown) {
      console.error("Error deleting summary:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete summary");
    } finally {
      setDeletingId(null);
    }
  };

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  function extractVideoId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  function getYouTubeTitle(videoId: string | null) {
    return videoId ? `Video ${videoId}` : "Unknown Video";
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">My Summaries</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Summaries</h1>
      </div>

      {selectedSummary ? (
        <div className="mb-6">
          <button 
            className="text-primary hover:underline mb-4"
            onClick={() => setSelectedSummary(null)}>
            &larr; Back to all summaries
          </button>
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedSummary.title || getYouTubeTitle(extractVideoId(selectedSummary.youtube_url))}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Summarized on {formatDate(selectedSummary.created_at)}
              </div>
              <a 
                href={selectedSummary.youtube_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View Original Video
              </a>
            </CardHeader>
            <CardContent>
              <div 
                className="bg-muted/30 p-4 rounded-md whitespace-pre-wrap prose dark:prose-invert max-w-none" 
                dangerouslySetInnerHTML={{ __html: selectedSummary.summary_content }}
              >
                {/* Content is set by dangerouslySetInnerHTML */}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {summaries.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-border bg-card">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Video Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date Summarized</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {summaries.map((summary) => (
                    <tr key={summary.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {summary.title || getYouTubeTitle(extractVideoId(summary.youtube_url))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(summary.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button 
                          variant="link"
                          className="text-primary hover:underline p-0 h-auto"
                          onClick={() => setSelectedSummary(summary)}
                          disabled={deletingId === summary.id}
                        >
                          View
                        </Button>
                        <Button 
                          variant="link"
                          className="text-destructive hover:underline p-0 h-auto"
                          onClick={() => deleteSummary(summary.id)}
                          disabled={deletingId === summary.id}
                        >
                          {deletingId === summary.id ? (
                             <svg className="animate-spin h-4 w-4 text-destructive" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                          ) : "Delete"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">You haven't created any summaries yet.</p>
              <button 
                className="mt-4 text-primary hover:underline"
                onClick={() => window.location.href = '/dashboard'}
              >
                Create Your First Summary
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 