"use client"; // Needs to be client component for useRouter and onClick

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Use usePathname from next/navigation
import { useAuth, useClerk } from '@clerk/nextjs';
import { Loader2, User } from 'lucide-react';
// Import icons from lucide-react or another library if desired
// import { Home, List, Settings, LogOut } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname(); // Use usePathname hook for active state
  const { isLoaded, userId } = useAuth();
  const { openUserProfile } = useClerk();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  // Show loading state while checking authentication
  if (!isLoaded || !userId) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' /* icon: Home */ },
    { href: '/dashboard/summaries', label: 'Summaries' /* icon: List */ },
    { href: '/dashboard/billing', label: 'Billing' /* icon: List */ },
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
        <div className="mt-auto space-y-2">
          <button
            onClick={() => openUserProfile()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <User className="h-4 w-4" />
            <span>Manage Profile</span>
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
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