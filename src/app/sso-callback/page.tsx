import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0D0D0D] to-[#1a1a1a] px-4 py-8 text-white">
      <div className="w-full max-w-md p-8 rounded-lg bg-white/5 shadow-lg flex flex-col items-center">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">
            <span className="text-[#887D2B]">Authenticating</span>
          </h1>
          <p className="text-[#8C8C8C]">Please wait while we complete your sign-in...</p>
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-[#887D2B]"></div>
        <AuthenticateWithRedirectCallback />
      </div>
    </div>
  );
} 