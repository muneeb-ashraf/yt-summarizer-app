# Supabase Setup Guide

Follow these steps to set up your Supabase project:

1. Create a new Supabase project:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Click "New Project"
   - Fill in the project details
   - Wait for the database to be ready

2. Run Database Migrations:
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase/migrations/20240129_create_tables.sql`
   - Click "Run" to execute the migration

3. Configure Authentication:
   - In Supabase dashboard, go to Authentication > Providers
   - Enable Email auth and set these options:
     - Enable "Confirm email"
     - Set "Secure email change" to required
     - Enable "Double confirm changes"
   
   For Google OAuth:
   - Enable Google provider
   - Add authorized domains (your app's domain)
   - Add your Google Client ID and Secret
   
   For GitHub OAuth:
   - Enable GitHub provider
   - Add your GitHub Client ID and Secret
   - Set the callback URL as shown in the provider settings

4. Set up Row Level Security (RLS):
   - The migration script already includes RLS policies
   - Verify in Supabase dashboard under Authentication > Policies
   - You should see policies for users table:
     - "Users can view their own profile"
     - "Users can update their own profile"

5. Environment Variables:
   Get these values from Supabase dashboard (Settings > API):
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   For OAuth providers:
   ```
   VITE_SUPABASE_GOOGLE_CLIENT_ID=your-google-client-id
   VITE_SUPABASE_GOOGLE_SECRET=your-google-client-secret
   VITE_SUPABASE_GITHUB_CLIENT_ID=your-github-client-id
   VITE_SUPABASE_GITHUB_SECRET=your-github-client-secret
   ```
