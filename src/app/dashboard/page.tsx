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
  title?: string;
}

interface JobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  summaryId?: string;
  createdAt: string;
  completedAt?: string;
}

// Rename function to Page (conventional)
export default function Page() {
  const [videoUrl, setVideoUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [recentSummaries, setRecentSummaries] = useState<Summary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const { userId } = useAuth();
  
  // Fetch recent summaries on load
  useEffect(() => {
    if (userId) {
      fetchRecentSummaries();
    }
  }, [userId]);

  // Poll for job status when a job is active
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (currentJobId) {
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/summaries/job-status?jobId=${currentJobId}`);
          if (!response.ok) {
            throw new Error('Failed to check job status');
          }

          const jobStatus: JobStatus = await response.json();
          
          if (jobStatus.status === 'completed') {
            // Job completed successfully
            clearInterval(pollInterval);
            setCurrentJobId(null);
            setIsLoading(false);
            toast.success('Summary generated successfully!');
            fetchRecentSummaries(); // Refresh the list
          } else if (jobStatus.status === 'failed') {
            // Job failed
            clearInterval(pollInterval);
            setCurrentJobId(null);
            setIsLoading(false);
            toast.error(jobStatus.error || 'Failed to generate summary');
          }
          // For 'pending' and 'processing' states, continue polling
        } catch (error) {
          console.error('Error polling job status:', error);
          clearInterval(pollInterval);
          setCurrentJobId(null);
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
  }, [currentJobId]);

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

  // Function to handle summarization
  const handleSummarize = async () => {
    if (!videoUrl.trim()) return;
    
    try {
      setIsLoading(true);
      setSummary('');
      
      // Call the API to create a summarization job
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
      setCurrentJobId(data.jobId);
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
                  {currentJobId ? 'Processing...' : 'Starting...'}
                </>
              ) : "Summarize"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Paste the full YouTube video link (e.g., https://www.youtube.com/watch?v=...)</p>
        </div>
        
        {/* Summary Result Area */}
        {(summary || isLoading) && (
          <div className="p-6 bg-card rounded-lg border md:col-span-2 lg:col-span-3">
            <h2 className="text-xl font-semibold mb-4">Generated Summary</h2>
            {isLoading ? (
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
            <ul className="space-y-3">
              {recentSummaries.map((summary) => (
                <li key={summary.id} className="p-3 bg-muted/30 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{summary.title || `Video ${extractVideoId(summary.youtube_url)}`}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(summary.created_at)}
                      </p>
                    </div>
                    <Link href={`/dashboard/summaries?id=${summary.id}`} className="text-sm text-primary hover:underline">
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
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