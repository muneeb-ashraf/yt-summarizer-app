import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "../components/ui/toaster";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth-page";
import Dashboard from "./pages/dashboard";
import Settings from "./pages/settings";
import Subscription from "./pages/subscription";
import Home from "./pages/home";
import { useUser } from "./hooks/use-user";
import { Loader2 } from "lucide-react";
import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { ErrorBoundary } from "../components/error-boundary";

function ProtectedRoutes() {
  const { user, isLoading } = useUser();
  const [location] = useLocation();

  // Add error logging
  useEffect(() => {
    console.log("Current location:", location);
    console.log("User state:", { isLoading, hasUser: !!user });
    // Log environment variable availability (without exposing values)
    console.log("Environment variables check:", {
      hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      hasApiUrl: !!import.meta.env.VITE_API_URL
    });
  }, [location, user, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    if (location !== '/' && location !== '/auth') {
      window.location.href = '/auth';
      return null;
    }
    return (
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/auth" component={AuthPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (location === '/auth') {
    window.location.href = '/dashboard';
    return null;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/settings" component={Settings} />
      <Route path="/subscription" component={Subscription} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Add error boundary logging
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ProtectedRoutes />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;