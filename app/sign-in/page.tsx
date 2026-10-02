"use client";

import { useEffect, useState } from "react";
import { SignIn } from "@clerk/nextjs";
import { Sparkles, Loader2 } from "lucide-react";

export default function SignInPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 py-12">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-[0_0_25px_rgba(168,85,247,0.5)] mb-4">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-300">
            Welcome Back
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Sign in to your SkillProof workspace
          </p>
        </div>

        {/* Clerk SignIn in Glass Card */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(139,92,246,0.2)] min-h-[380px] flex items-center justify-center">
          {mounted ? (
            <SignIn
              routing="hash"
              forceRedirectUrl="/dashboard"
              fallbackRedirectUrl="/dashboard"
              appearance={{
                elements: {
                  formButtonPrimary:
                    "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] rounded-xl py-3 font-semibold",
                  card: "bg-transparent shadow-none w-full p-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton:
                    "border border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all",
                  socialButtonsBlockButtonText: "text-white font-medium text-sm",
                  formFieldInput:
                    "border-white/10 bg-white/5 text-white rounded-xl focus:border-purple-500/50 focus:ring-purple-500/20",
                  formFieldLabel: "text-gray-300 font-medium text-xs",
                  footerActionLink: "text-purple-400 hover:text-purple-300 font-semibold",
                  identityPreviewEditButton: "text-purple-400",
                  formResendCodeLink: "text-purple-400",
                },
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-xs text-gray-400">Loading sign in...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
