import React from "react";
import Link from "next/link";
import { HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 text-center p-6">
      <div className="p-5 bg-primary/10 text-primary rounded-3xl border border-primary/20">
        <HelpCircle className="w-12 h-12" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-foreground">Page Not Found</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The workspace view you are looking for doesn&apos;t exist or was moved. Let&apos;s get you back on track!
        </p>
      </div>
      <Link
        href="/dashboard"
        className="px-6 py-3 rounded-xl gradient-bg text-white font-semibold shadow-lg hover:opacity-90 hover:scale-[1.01] transition-all"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
