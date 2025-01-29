import { createClient } from '@supabase/supabase-js';

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL');
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Types based on your Supabase database schema
export type Tables = {
  users: {
    id: string;
    email: string;
    username: string;
    subscription: 'free' | 'pro' | 'enterprise';
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
    format: 'paragraph' | 'bullets' | 'timestamped';
    language: 'en' | 'es' | 'fr';
    metadata: any;
    created_at: string;
  };
}
