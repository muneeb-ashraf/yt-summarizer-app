import { Link, useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { useUser } from "../hooks/use-user";
import { SiYoutube } from "react-icons/si";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  CreditCard
} from "lucide-react";

export function NavSidebar() {
  const { logout } = useUser();
  const [location] = useLocation();

  return (
    <div className="w-64 border-r bg-card h-screen flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center space-x-2">
          <SiYoutube className="h-6 w-6 text-red-500" />
          <span className="font-bold text-lg">AI Summarizer</span>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <Link href="/dashboard">
            <Button
              variant={location === '/dashboard' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <LayoutDashboard className="mr-2 h-5 w-5" />
              Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/subscription">
            <Button
              variant={location === '/dashboard/subscription' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Subscription
            </Button>
          </Link>
          <Link href="/dashboard/settings">
            <Button
              variant={location === '/dashboard/settings' ? 'secondary' : 'ghost'}
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
          className="w-full justify-start text-red-500"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}