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
    <header className="h-16 border-b border-white/5 bg-zinc-950/40 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center justify-between h-full px-6 lg:px-8">
        {/* Left spacer for mobile hamburgers */}
        <div className="lg:hidden w-12" />

        {/* Workspace Active Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Premium Workspace Active
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          {mounted && (
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
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
            className="p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 text-muted-foreground hover:text-foreground transition-all duration-200 relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
          </button>

          {/* Vertical Separator */}
          <div className="h-6 w-px bg-white/10 mx-1" />

          {/* Clerk User Button Profile */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-7 w-7 border border-white/10 rounded-full",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}

export default React.memo(DashboardHeader);
