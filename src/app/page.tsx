import { HydrateClient } from "@/trpc/server";
import Dashboard from "./_components/Dashboard";
import OutputDashboard from "./_components/OutputDashboard";
import { Suspense } from "react";
import Link from "next/link";
import { SignedIn, UserButton } from "@clerk/nextjs";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="min-h-screen bg-gradient-to-b from-[#0D0D0D] to-[#1a1a1a] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              <span className="text-[#887D2B]">Power & Grace</span> Performance Analytics
            </h1>
            <nav className="hidden space-x-8 md:flex items-center">
              <Link href="/" className="text-white hover:text-[#887D2B]">Dashboard</Link>
              <Link href="/athletes" className="text-[#8C8C8C] hover:text-white">Athletes</Link>
              <SignedIn>
                <div className="ml-4">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            </nav>
            <button className="rounded-md bg-white/10 p-2 md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </header>
          
          <Suspense fallback={
            <div className="flex items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-[#887D2B]"></div>
              <span className="ml-3 text-xl text-white">Loading dashboard...</span>
            </div>
          }>
            <OutputDashboard />
          </Suspense>
        </div>
      </main>
    </HydrateClient>
  );
}
