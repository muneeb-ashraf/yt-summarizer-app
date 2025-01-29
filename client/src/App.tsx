import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth-page";
import Dashboard from "./pages/dashboard";
import Settings from "./pages/settings";
import Subscription from "./pages/subscription";
import Home from "./pages/home";
import { useUser } from "./hooks/use-user";
import { Loader2 } from "lucide-react";
import { Switch, Route, useLocation } from "wouter";

function ProtectedRoutes() {
  const { user, isLoading } = useUser();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    if (location.startsWith('/dashboard')) {
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
      <Route path="/dashboard/settings" component={Settings} />
      <Route path="/dashboard/subscription" component={Subscription} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProtectedRoutes />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;