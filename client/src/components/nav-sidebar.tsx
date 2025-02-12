import { Link, useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { useUser } from "../hooks/use-user";
import { SiYoutube } from "react-icons/si";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  CreditCard,
  Loader2,
} from "lucide-react";
import { useState } from "react";

export function NavSidebar() {
  const { logout } = useUser();
  const [location] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      window.location.href = '/auth';
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="w-64 border-r bg-card h-screen flex flex-col">
      <div className="p-6 border-b">
        <Link href="/dashboard">
          <div className="flex items-center space-x-2 cursor-pointer">
            <SiYoutube className="h-6 w-6 text-red-500" />
            <span className="font-bold text-lg">AI Summarizer</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <Link href="/dashboard">
            <Button
              variant={location === "/dashboard" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <LayoutDashboard className="mr-2 h-5 w-5" />
              Dashboard
            </Button>
          </Link>
          <Link href="/subscription">
            <Button
              variant={location === "/subscription" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Subscription
            </Button>
          </Link>
          <Link href="/settings">
            <Button
              variant={location === "/settings" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </Button>
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-5 w-5" />
          )}
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );
}