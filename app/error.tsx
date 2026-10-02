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
      <div className="p-4 bg-danger/10 text-danger rounded-2xl border border-danger/20">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-xl font-bold text-foreground">Something went wrong!</h2>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred in your workspace session. You can try reloading the active page view.
        </p>
      </div>
      <Button variant="gradient" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
