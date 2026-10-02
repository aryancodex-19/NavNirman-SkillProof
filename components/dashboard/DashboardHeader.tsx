"use client";

import React, { useEffect, useState, useCallback } from "react";
import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Moon, Sun, Bell, ShieldCheck } from "lucide-react";

function DashboardHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <header className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between h-full px-6 lg:px-8">
        {/* Left spacer for mobile hamburger */}
        <div className="lg:hidden w-12" />

        {/* Workspace Active Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <ShieldCheck className="h-4 w-4 text-purple-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Verified AI Workspace
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          {mounted && (
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-xl hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all duration-200 cursor-pointer bg-white/[0.02]"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Notifications Button */}
          <button
            className="p-2 rounded-xl hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all duration-200 relative cursor-pointer bg-white/[0.02]"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          </button>

          {/* Vertical Separator */}
          <div className="h-6 w-px bg-white/10 mx-1" />

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
