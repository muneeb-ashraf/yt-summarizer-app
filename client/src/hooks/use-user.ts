import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { User } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';

export type AuthError = {
  message: string;
};

export function useUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser
  } = useQuery<User | null, AuthError>({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user) return null;

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          return null;
        }

        return profile;
      } catch (error) {
        console.error('Auth error:', error);
        return null;
      }
    },
    staleTime: 0, // Always refetch when requested
    gcTime: 0, // Don't cache the data
  });

  // Listen to auth state changes and subscription updates
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Force refetch user data
        await refetchUser();
        queryClient.invalidateQueries({ queryKey: ['user'] });
      } else if (event === 'SIGNED_OUT') {
        queryClient.setQueryData(['user'], null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, refetchUser]);

  return {
    user,
    error,
    isLoading,
    refetchUser,
  };
}