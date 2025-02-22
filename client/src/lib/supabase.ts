import { createClient } from "@supabase/supabase-js";

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error("Missing environment variable: VITE_SUPABASE_URL");
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error("Missing environment variable: VITE_SUPABASE_ANON_KEY");
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  }
);

// Types based on your database schema
export type Tables = {
  users: {
    id: string;
    email: string;
    username: string;
    subscription: "free" | "pro" | "enterprise";
    stripe_customer_id?: string;
    avatar_url?: string;
    created_at: string;
  };
  summaries: {
    id: string;
    user_id: string;
    video_id: string;
    video_title: string;
    video_duration: number;
    summary: string;
    format: "paragraph" | "bullets" | "timestamped";
    language: string;
    metadata: Record<string, any>;
    created_at: string;
  };
};

export type User = Tables["users"];
export type Summary = Tables["summaries"];

// Helper to get current session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
};