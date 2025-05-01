import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define routes that REQUIRE authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)', // Matches /dashboard and any subpaths
]);

export default clerkMiddleware((auth, req) => {
  // @ts-ignore - Ignore type error for protect() on promise
 
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets and other Next.js internals.
  matcher: [ '/((?!.+\.[\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};