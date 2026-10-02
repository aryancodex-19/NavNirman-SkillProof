"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  User,
  Settings,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
  Mic,
  FileText,
  ScanSearch,
  BrainCircuit,
  Briefcase,
  Video,
  Code2,
  Share2,
  Layout,
  GitGraph,
} from "lucide-react";
import { useTheme } from "next-themes";

const NAV_GROUPS = [
  {
    name: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "AI Resume Builder", href: "/dashboard/resume", icon: FileText },
      { label: "ATS Scanner", href: "/dashboard/ats", icon: ScanSearch },
      { label: "Portfolio Generator", href: "/dashboard/portfolio", icon: Layout },
      { label: "LinkedIn Optimizer", href: "/dashboard/linkedin", icon: Share2 },
      { label: "GitHub Analysis", href: "/dashboard/github", icon: GitGraph },
    ]
  },
  {
    name: "Practice & Search",
    items: [
      { label: "AI Voice Interview", href: "/dashboard/interview-voice", icon: Mic },
      { label: "AI Interview Coach", href: "/dashboard/interview", icon: Video },
      { label: "AI Career Mentor", href: "/dashboard/mentor", icon: BrainCircuit },
      { label: "Coding Tracker", href: "/dashboard/coding", icon: Code2 },
      { label: "Internship Finder", href: "/dashboard/internships", icon: Briefcase },
    ]
  },
  {
    name: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: User },
    ]
  }
];

function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleCloseMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <>
      {/* Mobile background shade overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
            onClick={handleCloseMobile}
          />
        )}
      </AnimatePresence>

      {/* Mobile Toggle Hamburger button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleToggleMobile}
        className="fixed top-3.5 left-4 z-50 lg:hidden p-2.5 rounded-xl bg-white/[0.03] border border-white/5 shadow-2xl backdrop-blur-md hover:bg-white/[0.08] transition-all cursor-pointer"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? (
          <X className="h-5 w-5 text-foreground" />
        ) : (
          <Menu className="h-5 w-5 text-foreground" />
        )}
      </motion.button>

      {/* Sidebar Panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 w-64
          bg-white/[0.02] border-r border-white/5 backdrop-blur-2xl
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          flex flex-col
        `}
      >
        {/* Title Logo */}
        <div className="flex items-center gap-3 h-16 px-6 border-b border-white/5 shrink-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-600 to-pink-500 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
            CareerOS
          </span>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-none">
          {NAV_GROUPS.map((group) => (
            <div key={group.name} className="space-y-1.5">
              <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {group.name}
              </h4>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleCloseMobile}
                      className={`
                        flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold
                        transition-all duration-200 group relative
                        ${
                          isActive
                            ? "text-indigo-400"
                            : "text-muted-foreground hover:text-foreground"
                        }
                      `}
                    >
                      {/* Active Indicator Sliding Background */}
                      {isActive && (
                        <motion.div
                          layoutId="activeNavBackground"
                          className="absolute inset-0 bg-indigo-500/10 border-l-2 border-indigo-500 rounded-xl"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}

                      <item.icon
                        className={`h-[16px] w-[16px] shrink-0 transition-colors z-10 ${
                          isActive ? "text-indigo-400" : "group-hover:text-foreground"
                        }`}
                      />
                      <span className="z-10">{item.label}</span>
                      {isActive && (
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-indigo-500/85 z-10" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-white/5 bg-black/20 space-y-3 shrink-0">
          {mounted && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
              <span className="text-muted-foreground font-bold">Theme</span>
              <button
                onClick={handleToggleTheme}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground border border-white/5 bg-white/[0.01] transition-all cursor-pointer"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-3.5 w-3.5" />
                ) : (
                  <Moon className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-indigo-500/10 shrink-0">
              AI
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-foreground truncate">
                AI Copilot
              </p>
              <p className="text-[9px] text-muted-foreground font-medium">Connected</p>
            </div>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}

export default React.memo(Sidebar);
