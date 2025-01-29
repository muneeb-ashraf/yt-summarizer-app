import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Tables } from '../lib/supabase';

type User = Tables['users'];

export type AuthError = {
  message: string;
};

export function useUser() {
  const queryClient = useQueryClient();

  // Fetch user data including profile
  const { data: user, error, isLoading } = useQuery<User | null, AuthError>({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) return null;

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      return profile;
    },
  });

  // Login with email/password
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { ok: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  // Register new user
  const registerMutation = useMutation({
    mutationFn: async ({ email, password, username }: { email: string; password: string; username: string }) => {
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: data.user?.id,
          email,
          username,
          subscription: 'free',
        }]);

      if (profileError) throw profileError;

      return { ok: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  // Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { ok: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return {
    user,
    error,
    isLoading,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}