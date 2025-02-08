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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/summaries', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      return res.json();
    }
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/summaries', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(params),
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      return res.json();
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