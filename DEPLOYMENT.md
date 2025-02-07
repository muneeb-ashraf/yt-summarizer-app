# Deploying to Vercel

Follow these steps to deploy the application to Vercel:

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. Connect your GitHub repository to Vercel:
   - Go to https://vercel.com
   - Create a new project
   - Import your GitHub repository
   - Configure the project settings:
     - Framework Preset: Vite
     - Root Directory: ./
     - Build Command: npm run build
     - Output Directory: dist/public

3. Add Environment Variables in Vercel:
   Required environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `VITE_SUPABASE_GOOGLE_CLIENT_ID`: Google OAuth client ID
   - `VITE_SUPABASE_GOOGLE_SECRET`: Google OAuth client secret
   - `VITE_SUPABASE_GITHUB_CLIENT_ID`: GitHub OAuth client ID
   - `VITE_SUPABASE_GITHUB_SECRET`: GitHub OAuth client secret
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `YOUTUBE_API_KEY`: Your YouTube Data API key

4. Deploy:
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

5. After deployment:
   - Update your Supabase OAuth redirect URLs to include your Vercel domain
   - Test the authentication flow with all providers
   - Verify that the API endpoints are working correctly

Note: Make sure your Supabase project is properly configured with the necessary auth providers and database tables.
