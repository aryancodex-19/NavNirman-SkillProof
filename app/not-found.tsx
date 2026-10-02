import React from "react";
import Link from "next/link";
import { HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 text-center p-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-3xl bg-purple-500/20 blur-2xl" />
        <div className="relative p-5 bg-white/[0.03] backdrop-blur-xl text-purple-300 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(139,92,246,0.15)]">
          <HelpCircle className="w-12 h-12 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
        </div>
      </div>
      <div className="space-y-2 max-w-sm">
        <h1 className="text-4xl font-extrabold tracking-tighter gradient-text">404</h1>
        <h2 className="text-xl font-bold text-white">Page Not Found</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          The workspace view you are looking for doesn&apos;t exist or was moved. Let&apos;s get you back on track!
        </p>
      </div>
      <Link
        href="/dashboard"
        className="shimmer relative overflow-hidden px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold transition-all duration-300 shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:shadow-[0_0_40px_rgba(139,92,246,0.8)] hover:scale-[1.02] active:scale-[0.97]"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
