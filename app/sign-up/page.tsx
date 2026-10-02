"use client";

import { SignUp } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-primary/5" />

      {/* Floating orbs */}
      <div className="absolute top-20 right-[15%] w-72 h-72 rounded-full bg-accent/10 blur-3xl animate-float" />
      <div className="absolute bottom-20 left-[15%] w-80 h-80 rounded-full bg-primary/8 blur-3xl animate-float-delayed" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6 py-12 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl gradient-bg text-white shadow-lg shadow-primary/25 mb-4">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Create Account
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Start your journey with CareerOS
          </p>
        </div>

        {/* Clerk SignUp */}
        <div className="glass rounded-2xl p-6 shadow-xl">
          <SignUp
            routing="hash"
            forceRedirectUrl="/dashboard"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg",
                card: "bg-transparent shadow-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border-border bg-card hover:bg-muted text-foreground",
                socialButtonsBlockButtonText: "text-foreground font-medium",
                formFieldInput:
                  "border-input bg-card text-foreground rounded-xl",
                formFieldLabel: "text-foreground",
                footerActionLink: "text-primary hover:text-primary-hover",
                identityPreviewEditButton: "text-primary",
                formResendCodeLink: "text-primary",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}