"use client";

import React, { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Next.js App Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center gap-5 text-center p-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-red-500/20 blur-2xl" />
        <div className="relative p-4 bg-white/[0.03] backdrop-blur-xl text-red-400 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(239,68,68,0.15)]">
          <AlertTriangle className="w-10 h-10" />
        </div>
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-xl font-bold text-white">Something went wrong!</h2>
        <p className="text-sm text-gray-400">
          An unexpected error occurred in your workspace session. You can try reloading the active page view.
        </p>
      </div>
      <Button variant="gradient" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
