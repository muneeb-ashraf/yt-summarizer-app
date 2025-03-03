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
      storage: undefined
    }
  }
);

// Export auth helper
export const getUser = async (token: string) => {
  try {
    if (!token) {
      console.error('No auth token provided');
      return null;
    }

    // Create a new client with the provided token
    const authClient = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          storage: undefined
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { data: { user }, error } = await authClient.auth.getUser();

    if (error) {
      console.error('Supabase auth error:', error);
      return null;
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
        autoRefreshToken: false,
        storage: undefined
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );
};