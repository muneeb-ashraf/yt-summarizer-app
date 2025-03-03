import { createClient } from '@supabase/supabase-js';
import type { Database } from '@db/types';

// Check for required environment variables
if (!process.env.VITE_SUPABASE_URL) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL');
}

if (!process.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY');
}

// Create Supabase client with explicit configuration
export const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      autoRefreshToken: true,
      storage: undefined // Disable storage since we're on server-side
    }
  }
);

// Export auth helper
export const getUser = async (token: string) => {
  try {
    if (!token) {
      throw new Error('No auth token provided');
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('Supabase auth error:', error);
      throw error;
    }

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// Helper to create an authenticated client
export const getAuthenticatedClient = (token: string) => {
  if (!token) {
    throw new Error('No auth token provided');
  }

  return createClient<Database>(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
        autoRefreshToken: true,
        storage: undefined // Disable storage since we're on server-side
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );
};