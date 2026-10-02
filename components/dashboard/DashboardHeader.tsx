"use client";

import React from "react";
import { UserButton } from "@clerk/nextjs";

function DashboardHeader() {
  return (
    <header className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between h-full px-6 lg:px-8">
        {/* Left spacer for mobile hamburger */}
        <div className="lg:hidden w-12" />

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Clerk User Button Profile */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 border border-purple-500/30 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.3)]",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}

export default React.memo(DashboardHeader);
