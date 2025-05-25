"use client"; // Add directive if using hooks/state/handlers now or later
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";

interface Summary {
  id: string;
  youtube_url: string;
  summary_content: string;
  created_at: string;
}

interface SummaryStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  summaryId: string;
  createdAt: string;
  completedAt?: string;
}

// Rename function to Page (conventional)
export default function Page() {
  const [videoUrl, setVideoUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [recentSummaries, setRecentSummaries] = useState<Summary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSummaryId, setCurrentSummaryId] = useState<string | null>(null);
  const { userId } = useAuth();
  
  // Fetch recent summaries on load
  useEffect(() => {
    if (userId) {
      fetchRecentSummaries();
    }
  }, [userId]);

  // Poll for summary status when a summary is being processed
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (currentSummaryId) {
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/summaries/job-status?summaryId=${currentSummaryId}`);
          if (!response.ok) {
            throw new Error('Failed to check summary status');
          }

          const summaryStatus: SummaryStatus = await response.json();
          
          if (summaryStatus.status === 'completed') {
            // Summary completed successfully
            clearInterval(pollInterval);
            setCurrentSummaryId(null);
            setIsLoading(false);
            toast.success('Summary generated successfully!');
            // Fetch the complete summary to display
            fetchSummaryContent(summaryStatus.summaryId);
            fetchRecentSummaries(); // Refresh the list
          } else if (summaryStatus.status === 'failed') {
            // Summary failed
            clearInterval(pollInterval);
            setCurrentSummaryId(null);
            setIsLoading(false);
            toast.error(summaryStatus.error || 'Failed to generate summary');
          }
          // For 'pending' and 'processing' states, continue polling
        } catch (error) {
          console.error('Error polling summary status:', error);
          clearInterval(pollInterval);
          setCurrentSummaryId(null);
          setIsLoading(false);
          toast.error('Error checking summary status');
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [currentSummaryId, fetchRecentSummaries]);

  // Function to fetch recent summaries
  const fetchRecentSummaries = async () => {
    try {
      const response = await fetch('/api/summaries/recent');
      if (response.ok) {
        const data = await response.json();
        setRecentSummaries(data.summaries || []);
      }
    } catch (error) {
      console.error('Error fetching recent summaries:', error);
    }
  };

  // Function to fetch and set the summary content for display
  const fetchSummaryContent = async (summaryId: string) => {
    try {
      const response = await fetch(`/api/summaries/${summaryId}`); // Assuming an endpoint like /api/summaries/[id] exists
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary.summary_content); // Assuming the response structure is { summary: { summary_content: '...' } }
      } else {
        console.error('Failed to fetch summary content:', response.statusText);
        setSummary('Error loading summary content.');
      }
    } catch (error) {
      console.error('Error fetching summary content:', error);
      setSummary('Error loading summary content.');
    }
  };

  // Function to handle summarization
  const handleSummarize = async () => {
    if (!videoUrl.trim()) return;
    
    try {
      setIsLoading(true);
      setSummary('');
      
      // Call the API to create a summary
      const response = await fetch('/api/summaries/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ youtubeUrl: videoUrl }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start summarization');
      }
      
      const data = await response.json();
      setCurrentSummaryId(data.summaryId);
      toast.info('Started generating summary...');
      
    } catch (error: unknown) {
      console.error('Error starting summarization:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start summarization');
      setIsLoading(false);
    }
  };

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  function extractVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  function getYouTubeTitle(videoId: string | null): string {
    // Implement your logic to fetch and return the YouTube video title based on the videoId
    return videoId ? `Video ${videoId}` : 'Untitled Video';
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Summarize Input */}
        <div className="p-6 bg-card rounded-lg border md:col-span-2 lg:col-span-3">
          <h2 className="text-xl font-semibold mb-4">Summarize New Video</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste YouTube video URL here..."
              className="flex-grow p-2 border rounded-md bg-input"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={isLoading}
            />
            <Button 
              onClick={handleSummarize}
              disabled={isLoading || !videoUrl.trim()}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {currentSummaryId ? 'Processing...' : 'Starting...'}
                </>
              ) : "Summarize"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Paste the full YouTube video link (e.g., https://www.youtube.com/watch?v=...)</p>
        </div>
        
        {/* Summary Result Area */}
        {(summary || (isLoading && currentSummaryId)) && (
          <div className="p-6 bg-card rounded-lg border md:col-span-2 lg:col-span-3">
            <h2 className="text-xl font-semibold mb-4">Generated Summary</h2>
            {isLoading && currentSummaryId ? (
              <div className="space-y-3">
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-[80%]" />
              </div>
            ) : (
              <div 
                className="bg-muted/30 p-4 rounded-md whitespace-pre-wrap prose dark:prose-invert max-w-none" 
                dangerouslySetInnerHTML={{ __html: summary }}
              >
                {/* Content is set by dangerouslySetInnerHTML */}
              </div>
            )}
          </div>
        )}
        
        {/* Placeholder Card: Plan Status */}
        <div className="p-6 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">Current Plan</h2>
          <p className="text-4xl font-bold">Free Tier</p>
          <p className="text-muted-foreground mt-1">Unlimited summaries</p>
          <Link href="/dashboard/billing" className="mt-4 inline-block text-sm text-primary hover:underline">
            Upgrade Plan
          </Link>
        </div>
        
        {/* Placeholder Card: Credits */}
        <div className="p-6 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">Available Credits</h2>
          <p className="text-4xl font-bold">{recentSummaries.length > 0 ? recentSummaries.length : 0} / ∞</p>
          <p className="text-muted-foreground mt-1">Unlimited credits</p>
        </div>
        
        {/* Placeholder Card: Usage */}
        <div className="p-6 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">Summaries This Month</h2>
          <p className="text-4xl font-bold">{recentSummaries.length > 0 ? recentSummaries.length : 0}</p>
          <p className="text-muted-foreground mt-1">Keep creating!</p>
        </div>
        
        {/* Recent Summaries List */}
        <div className="p-6 bg-card rounded-lg border md:col-span-2 lg:col-span-3">
          <h2 className="text-xl font-semibold mb-4">Recent Summaries</h2>
          {recentSummaries.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="bg-white divide-y divide-gray-200">
              {recentSummaries.map((summary) => (
                  <tr key={summary.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {getYouTubeTitle(extractVideoId(summary.youtube_url))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(summary.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <Link href={`/dashboard/summaries?id=${summary.id}`} className="text-sm text-primary hover:underline">
                      View
                    </Link>
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground">No summaries yet. Try summarizing your first video!</p>
          )}
          <Link href="/dashboard/summaries" className="text-sm text-primary hover:underline mt-4 inline-block">
            View All Summaries
          </Link>
        </div>
      </div>
    </div>
  );
} 