import { HydrateClient } from "@/trpc/server";
import Dashboard from "./_components/Dashboard";
import OutputDashboard from "./_components/OutputDashboard";
import { Suspense } from "react";
import Link from "next/link";
import { SignedIn, UserButton } from "@clerk/nextjs";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="min-h-screen bg-gradient-to-b from-[#0D0D0D] to-[#1a1a1a] px-4 py-6 sm:py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6 sm:mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                <span className="text-[#887D2B]">Power & Grace</span> 
                <span className="block sm:inline"> Performance Analytics</span>
              </h1>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-6 lg:space-x-8 items-center">
                <Link href="/" className="text-white hover:text-[#887D2B] transition-colors">
                  Dashboard
                </Link>
                <Link href="/athletes" className="text-[#8C8C8C] hover:text-white transition-colors">
                  Athletes
                </Link>
                <Link href="/reports" className="text-[#8C8C8C] hover:text-white transition-colors">
                  Reports
                </Link>
                <SignedIn>
                  <div className="ml-4">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
              </nav>
              
              {/* Mobile Navigation */}
              <div className="flex items-center justify-between md:hidden">
                <div className="flex space-x-4 items-center">
                  <Link href="/" className="text-white hover:text-[#887D2B] transition-colors text-sm">
                    Dashboard
                  </Link>
                  <Link href="/athletes" className="text-[#8C8C8C] hover:text-white transition-colors text-sm">
                    Athletes
                  </Link>
                  <Link href="/reports" className="text-[#8C8C8C] hover:text-white transition-colors text-sm">
                    Reports
                  </Link>
                </div>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </div>
          </header>
          
          <Suspense fallback={
            <div className="flex items-center justify-center py-12 sm:py-16">
              <div className="h-8 w-8 sm:h-10 sm:w-10 animate-spin rounded-full border-b-2 border-t-2 border-[#887D2B]"></div>
              <span className="ml-3 text-lg sm:text-xl text-white">Loading dashboard...</span>
            </div>
          }>
            <OutputDashboard />
          </Suspense>
        </div>
      </main>
    </HydrateClient>
  );
}
