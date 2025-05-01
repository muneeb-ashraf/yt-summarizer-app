"use client"; // Needs to be client component for useRouter and onClick

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Use usePathname from next/navigation
// Import icons from lucide-react or another library if desired
// import { Home, List, Settings, LogOut } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname(); // Use usePathname hook for active state

  // Placeholder logout function
  const handleLogout = () => {
    console.log('Logging out...');
    // Add actual logout logic here (e.g., clear session, redirect)
    router.push('/'); // Redirect to home/login page after logout
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' /* icon: Home */ },
    { href: '/dashboard/summaries', label: 'Summaries' /* icon: List */ },
    { href: '/dashboard/billing', label: 'Billing' /* icon: List */ },
    { href: '/dashboard/settings', label: 'Settings' /* icon: Settings */ },
  ];

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background p-4">
        <nav className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight mb-4 px-2">Summarizer</h2>
          {navItems.map((item) => {
            const isActive = pathname === item.href; // Compare with pathname
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? 'bg-muted text-primary font-semibold' : ''}`}>
                {/* {item.icon && <item.icon className="h-4 w-4" />} */}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
           <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                {/* <LogOut className="h-4 w-4" /> */}
                <span>Logout</span>
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1">
        {/* Optional: Header for smaller screens or additional controls */}
         {/* <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6"></header> */}
        <main className="flex-1 p-6">
          {children} {/* Page content for dashboard routes renders here */}
        </main>
      </div>
    </div>
  );
} 