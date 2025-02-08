# Setting up Social Authentication

To enable Google and GitHub authentication, follow these steps:

## 1. Enable Providers in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to Authentication > Providers

### For Google Auth:
1. Find and enable the Google provider
2. Go to [Google Cloud Console](https://console.cloud.google.com)
3. Create a new project or select an existing one
4. Enable the Google+ API
5. Go to Credentials > Create Credentials > OAuth Client ID
6. Add authorized origins:
   - `http://localhost:5000` (for development)
   - Your production URL
7. Add authorized redirect URIs:
   - `http://localhost:5000/auth/callback`
   - `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
8. Copy the Client ID and Client Secret
9. Paste these values in your Supabase Dashboard under the Google provider settings

### For GitHub Auth:
1. Find and enable the GitHub provider
2. Go to [GitHub Developer Settings](https://github.com/settings/developers)
3. Click "New OAuth App"
4. Add Homepage URL: Your app's URL
5. Add Authorization callback URL:
   - `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
6. Copy the Client ID and Client Secret
7. Paste these values in your Supabase Dashboard under the GitHub provider settings

## 2. Update Environment Variables

Make sure these environment variables are set in your project:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_SUPABASE_GOOGLE_SECRET=your-google-secret
VITE_SUPABASE_GITHUB_CLIENT_ID=your-github-client-id
VITE_SUPABASE_GITHUB_SECRET=your-github-secret
```

## 3. Additional Notes
- Ensure all redirect URLs match exactly between your OAuth providers and Supabase settings
- For production, add your production domain to the authorized domains list
- Test the authentication flow in both development and production environments
