import { createClient } from "@supabase/supabase-js";

// Get environment variables with logging
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log availability without exposing values
console.log("Supabase configuration status:", {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  isDevelopment: import.meta.env.DEV
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing required Supabase configuration.");
  if (import.meta.env.DEV) {
    console.warn("Development environment detected. Using fallback configuration.");
  }
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
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

// Helper to get current session with error handling
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Unexpected error getting session:', error);
    return null;
  }
};