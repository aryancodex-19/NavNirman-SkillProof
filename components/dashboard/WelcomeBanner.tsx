"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import AnimatedButton from "@/components/ui/AnimatedButton";

interface WelcomeBannerProps {
  displayName: string;
  targetRole?: string | null;
}

export default function WelcomeBanner({ displayName, targetRole }: WelcomeBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard hoverEffect={false} glowColor="indigo" className="p-8 sm:p-10 text-white relative bg-gradient-to-br from-indigo-950/20 via-zinc-950/40 to-purple-950/10">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-500/10 blur-[80px]" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-pink-500/5 blur-[80px]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Active Member
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Welcome back, <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">{displayName}</span>!
            </h1>

            <p className="text-gray-300 text-sm max-w-xl leading-relaxed">
              Your AI-powered workspace is ready. Tailor resumes, practice voice mocks, track coding milestones, and find internships all in one unified dashboard.
            </p>

            {targetRole ? (
              <div className="flex items-center gap-2.5 pt-1">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Target Role:</span>
                <span className="bg-white/5 border border-white/10 text-indigo-300 px-3 py-1 rounded-lg text-xs font-bold">
                  {targetRole}
                </span>
              </div>
            ) : (
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors pt-1"
              >
                Complete profile configuration
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {/* Quick Action buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <Link href="/profile" passHref>
              <AnimatedButton variant="glass" className="w-full sm:w-auto text-center justify-center border-white/5 bg-white/[0.02]">
                Configure Profile
              </AnimatedButton>
            </Link>
            <Link href="/dashboard/resume" passHref>
              <AnimatedButton variant="primary" className="w-full sm:w-auto text-center justify-center shadow-lg shadow-indigo-500/10">
                Build AI Resume
              </AnimatedButton>
            </Link>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
