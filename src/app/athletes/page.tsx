import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import AthletesList from "src/app/athletes/AthletesList";
import Link from "next/link";

export default function AthletesPage() {
  return (
    <HydrateClient>
      <main className="min-h-screen bg-gradient-to-b from-[#0D0D0D] to-[#1a1a1a] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              <span className="text-[#887D2B]">Output</span> Sports Analytics
            </h1>
            <nav className="hidden space-x-8 md:flex">
              <Link href="/" className="text-[#8C8C8C] hover:text-white">Dashboard</Link>
              <Link href="/athletes" className="text-white hover:text-[#887D2B]">Athletes</Link>
            </nav>
            <button className="rounded-md bg-white/10 p-2 md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </header>
          
          <div className="mb-8 border-b border-[#8C8C8C]/30">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
              <li className="mr-2">
                <a href="#" className="inline-block p-4 text-[#887D2B] border-b-2 border-[#887D2B] rounded-t-lg active">Athletes Directory</a>
              </li>
            </ul>
          </div>
          
          <Suspense fallback={
            <div className="flex items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-[#887D2B]"></div>
              <span className="ml-3 text-xl text-white">Loading athletes...</span>
            </div>
          }>
            <AthletesList />
          </Suspense>
        </div>
      </main>
    </HydrateClient>
  );
} 