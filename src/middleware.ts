import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)"
]);

// Define account sub-routes that need to be accessible to the UserProfile component
const isAccountSubRoute = createRouteMatcher([
  "/account/(.*)" // Allow all routes under /account/ to support UserProfile
]);

// This middleware protects all routes except auth-related ones and account sub-routes for UserProfile
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default clerkMiddleware(async (auth, req) => {
  // Check if the user is authenticated for all routes 
  // except public routes and account sub-routes
  if (!isPublicRoute(req)) {
    // Protect the /account parent route while keeping account sub-routes accessible
    // for the Clerk UserProfile component
    if (isAccountSubRoute(req)) {
      // Allow the request to proceed - UserProfile needs access to these routes
      return;
    }
    // For all other non-public routes, require authentication
    await auth.protect();
  }
});

export const config = {
  // Protects all routes, including api/trpc
  // You can also protect specific routes with clerk.protect() on individual routes
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};