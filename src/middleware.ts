import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware

const publicRoutes = [
  "/",
  "/api/webhooks/stripe",
  "/api/webhooks/clerk",
  "/sign-in*",
  "/sign-up*",
];

const ignoredRoutes = [
  "/api/webhooks/stripe",
  "/api/webhooks/clerk",
];

export async function middleware(request: NextRequest) {
  const { userId } = await getAuth(request);

  // Check if the route is public or ignored
  const isPublic = publicRoutes.some(route => 
    request.nextUrl.pathname.match(new RegExp(`^${route.replace('*', '.*')}$`))
  );
  const isIgnored = ignoredRoutes.some(route => 
    request.nextUrl.pathname.match(new RegExp(`^${route.replace('*', '.*')}$`))
  );

  // Allow public and ignored routes
  if (isPublic || isIgnored) {
    return NextResponse.next();
  }

  // Protect all other routes
  if (!userId) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};