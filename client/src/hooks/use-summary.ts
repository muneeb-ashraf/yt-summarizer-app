import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Summary } from '@db/schema';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '../lib/supabase';

interface CreateSummaryParams {
  videoId: string;
  format: string;
  language: string;
}

export function useSummaries() {
  const { data, isLoading, error } = useQuery<Summary[]>({
    queryKey: ['/api/summaries'],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
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
    error
  };
}

export function useCreateSummary() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (params: CreateSummaryParams) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
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

        return res.json();
      } catch (error: any) {
        console.error('Failed to create summary:', error);
        throw error;
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
    createSummary: mutation.mutate,
    isLoading: mutation.isPending
  };
}