import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center gap-4 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-purple-500/25 blur-2xl animate-pulse-glow" />
        <div className="relative w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-purple-300 animate-pulse" />
        </div>
      </div>
      <div>
        <h3 className="font-bold text-white text-sm">Loading CareerOS...</h3>
        <p className="text-xs text-gray-400 mt-1">Preparing your workspace</p>
      </div>
    </div>
  );
}
