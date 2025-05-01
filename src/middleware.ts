import { clerkMiddleware } from "@clerk/nextjs/server";

// Define routes that REQUIRE authentication
// If you need protected routes, re-introduce isProtectedRoute and use it:
// const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);
// export default clerkMiddleware((auth, req) => {
//   if (isProtectedRoute(req)) auth().protect();
// });

// Default Clerk middleware setup (protects nothing by default)
export default clerkMiddleware();

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets and other Next.js internals.
  matcher: [ '/((?!.+\.[\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};