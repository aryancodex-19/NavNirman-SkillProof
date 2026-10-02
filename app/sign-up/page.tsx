"use client";

import { SignUp } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

export default function SignUpPage() {
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
            Create Account
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Start your journey with SkillProof
          </p>
        </div>

        {/* Clerk SignUp in Glass Card */}
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(139,92,246,0.2)]">
          <SignUp
            routing="hash"
            forceRedirectUrl="/dashboard"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] rounded-xl py-3 font-semibold",
                card: "bg-transparent shadow-none p-0",
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
        </div>
      </div>
    </div>
  );
}