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
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

export function NavSidebar() {
  const { logout } = useUser();
  const [location] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 lg:hidden z-50"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm lg:hidden z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 border-r bg-card transform transition-transform duration-200 ease-in-out lg:transform-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
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
                onClick={() => setIsSidebarOpen(false)}
              >
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Dashboard
              </Button>
            </Link>
            <Link href="/subscription">
              <Button
                variant={location === "/subscription" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setIsSidebarOpen(false)}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Subscription
              </Button>
            </Link>
            <Link href="/settings">
              <Button
                variant={location === "/settings" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setIsSidebarOpen(false)}
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
    </>
  );
}