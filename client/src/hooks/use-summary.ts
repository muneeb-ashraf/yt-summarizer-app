import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Summary } from '../lib/supabase';
import { useToast } from './use-toast';
import { getCurrentSession } from '../lib/supabase';

interface CreateSummaryParams {
  videoId: string;
  format: string;
  language: string;
}

export function useSummaries() {
  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/summaries'],
    queryFn: async () => {
      try {
        const session = await getCurrentSession();
        if (!session) throw new Error('Not authenticated');

        const res = await fetch('/api/summaries', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Failed to parse error response' }));
          throw new Error(errorData.error || `Failed to fetch summaries: ${res.status}`);
        }

        const data = await res.json();
        return data;
      } catch (error: any) {
        console.error('Failed to fetch summaries:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    }
  });

  return {
    summaries: data || [],
    isLoading,
    error,
    refetch
  };
}

export function useCreateSummary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: CreateSummaryParams) => {
      try {
        const session = await getCurrentSession();
        if (!session) throw new Error('Not authenticated');

        const res = await fetch('/api/summaries', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        });

        // Always try to parse the response as JSON, with a fallback for invalid JSON
        const data = await res.json().catch(() => ({ 
          error: 'Failed to parse server response' 
        }));

        if (!res.ok) {
          throw new Error(data.error || `Failed to create summary: ${res.status}`);
        }

        return data as Summary;
      } catch (error: any) {
        console.error('Failed to create summary:', error);
        throw new Error(error.message || 'Failed to create summary');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/summaries'] });
      toast({
        title: "Success",
        description: "Summary created successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Summary creation error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    createSummary: mutation.mutateAsync,
    isLoading: mutation.isPending
  };
}

export function useDeleteSummary() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (summaryId: string) => {
      try {
        const session = await getCurrentSession();
        if (!session) throw new Error('Not authenticated');

        const res = await fetch(`/api/summaries/${summaryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Failed to parse error response' }));
          throw new Error(errorData.error || 'Failed to delete summary');
        }

        return res.json();
      } catch (error: any) {
        console.error('Failed to delete summary:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/summaries'] });
      toast({
        title: "Success",
        description: "Summary deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    deleteSummary: mutation.mutateAsync,
    isLoading: mutation.isPending
  };
}