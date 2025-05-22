import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Inter } from "next/font/google";
import Link from 'next/link';
import "@/styles/globals.css"; // Import global styles
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"] });

// Update metadata as needed
export const metadata: Metadata = {
  title: 'YouTube Summarizer AI', // Updated title
  description: 'Generate concise summaries of YouTube videos using AI.', // Updated description
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClerkProvider>
         
            <header className="flex justify-between items-center p-4 h-16 border-b bg-background">
              <h1 className="text-xl font-semibold">YouTube Summarizer AI</h1>
              <div className="flex items-center gap-4">
                <SignedOut>
                  <Link href="/sign-in">
                    <Button variant="outline">Sign In</Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button>Sign Up</Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </header>
            <main>{children}</main>
            <Toaster />
      
        </ClerkProvider>
      </body>
    </html>
  )
}