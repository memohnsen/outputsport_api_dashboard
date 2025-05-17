import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0D0D0D] to-[#1a1a1a] px-4 py-8 text-white">
      <div className="w-full max-w-md p-8 rounded-lg bg-white/5 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">
            <span className="text-[#887D2B]">Power & Grace</span>
          </h1>
          <p className="text-[#8C8C8C]">Create an account to access Performance Analytics</p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: "bg-[#887D2B] hover:bg-[#706823] text-white",
              footerActionLink: "text-[#887D2B] hover:text-[#706823]",
            }
          }}
        />
      </div>
    </div>
  );
} 