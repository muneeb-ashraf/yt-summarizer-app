import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Summary } from '@db/schema';
import { useToast } from '@/hooks/use-toast';
import { supabase, getCurrentSession } from '../lib/supabase';

interface CreateSummaryParams {
  videoId: string;
  format: string;
  language: string;
}

export function useSummaries() {
  const { data, isLoading, error, refetch } = useQuery<Summary[]>({
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
          const errorText = await res.text();
          throw new Error(errorText);
        }

        return res.json();
      } catch (error: any) {
        console.error('Failed to fetch summaries:', error);
        throw error;
      }
    },
    retry: false
  });

  return {
    summaries: data || [],
    isLoading,
    error,
    refetch
  };
}

export function useCreateSummary() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText);
        }

        const data = await res.json();
        return data;
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
          const errorText = await res.text();
          throw new Error(errorText);
        }

        return res.json();
      } catch (error: any) {
        console.error('Failed to delete summary:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/summaries'] });
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