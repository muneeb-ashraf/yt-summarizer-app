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
    "/sign-in*",
    "/sign-up*",
  ],
  // Routes that can be accessed while signed out
  ignoredRoutes: [
    "/api/webhooks/stripe",
    "/api/webhooks/clerk",
  ],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};