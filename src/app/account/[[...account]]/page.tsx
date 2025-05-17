import { currentUser } from "@clerk/nextjs/server";
import { UserProfile } from "@clerk/nextjs";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default async function AccountPage() {
  const user = await currentUser();

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0D0D0D] to-[#1a1a1a] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="text-[#887D2B]">My Account</span>
          </h1>
          <nav className="hidden space-x-8 md:flex items-center">
            <Link href="/" className="text-[#8C8C8C] hover:text-white">Dashboard</Link>
            <Link href="/athletes" className="text-[#8C8C8C] hover:text-white">Athletes</Link>
            <Link href="/account" className="text-white hover:text-[#887D2B]">My Account</Link>
            <div className="ml-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </nav>
        </header>

        <div className="rounded-lg bg-white/5 p-6 shadow-lg">
          <div className="mb-6">
            <h2 className="text-xl font-bold">User Profile</h2>
            <p className="text-[#8C8C8C]">Manage your personal information and account settings</p>
          </div>

          {user && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="mb-4 sm:mb-0 sm:mr-8">
                  <img 
                    src={user.imageUrl} 
                    alt={`${user.firstName}'s profile`} 
                    className="h-24 w-24 rounded-full"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-medium">{user.firstName} {user.lastName}</h3>
                  <p className="text-[#8C8C8C]">{user.emailAddresses[0]?.emailAddress}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8">
            <h3 className="mb-4 text-lg font-medium">Manage Your Profile</h3>
            <UserProfile />
          </div>
        </div>
      </div>
    </main>
  );
} 