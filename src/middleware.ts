import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { getUserCredits } from "@/lib/prisma";

// Define routes that REQUIRE authentication
// If you need protected routes, re-introduce isProtectedRoute and use it:
// const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);
// export default clerkMiddleware((auth, req) => {
//   if (isProtectedRoute(req)) auth().protect();
// });

const publicRoutes = ["/", "/api/webhooks/stripe", "/sign-in*", "/sign-up*"];

// Default Clerk middleware setup (protects nothing by default)
export default authMiddleware({
  publicRoutes: publicRoutes,
  async afterAuth(auth, req) {
    // Only check credits for summary generation endpoints
    if (req.nextUrl.pathname.startsWith("/api/summarize")) {
      if (!auth.userId) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

      try {
        const credits = await getUserCredits(auth.userId);

        if (!credits) {
          return new NextResponse("No credits found", { status: 400 });
        }

        if (credits.summariesLeft <= 0) {
          return new NextResponse(
            JSON.stringify({
              error: "No summaries left",
              plan: credits.plan,
              upgradeUrl: "/dashboard/billing",
            }),
            { status: 403 }
          );
        }
      } catch (error) {
        console.error("Error checking credits:", error);
        return new NextResponse("Error checking credits", { status: 500 });
      }
    }
  },
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets and other Next.js internals.
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};