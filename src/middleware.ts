import { authMiddleware } from "@clerk/nextjs";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/api/webhooks/stripe",
    "/api/webhooks/clerk",
    "/sign-in",
    "/sign-up",
    "/sign-in/[[...sign-in]]",
    "/sign-up/[[...sign-up]]"
  ],
  // Routes that can be accessed while signed out
  ignoredRoutes: [
    "/api/webhooks/stripe",
    "/api/webhooks/clerk"
  ],
});

// Stop Middleware running on static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next
     * - static (static files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!static|.*\\..*|_next|favicon.ico).*)",
    "/",
  ],
};