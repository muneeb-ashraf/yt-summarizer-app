import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

        // Force fresh data from server
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
    staleTime: 0, // Always fetch fresh data
    refetchInterval: 2000, // Poll every 2 seconds while subscription update is pending
  });

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  }, []);

  const register = useCallback(async ({ email, password, username }: { email: string; password: string; username: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });
    if (error) throw error;
    return data.user;
  }, []);

  const socialLogin = useCallback(async (provider: 'google' | 'github') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
    });
    if (error) throw error;
    return data;
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries({ queryKey: ['user'] });
      } else if (event === 'SIGNED_OUT') {
        queryClient.setQueryData(['user'], null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return {
    user,
    error,
    isLoading,
    refetchUser,
    login,
    register,
    socialLogin
  };
}