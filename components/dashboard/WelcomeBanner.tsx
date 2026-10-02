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
      <GlassCard
        hoverEffect={false}
        glowColor="purple"
        className="p-8 sm:p-10 text-white relative bg-gradient-to-br from-purple-950/25 via-black/50 to-indigo-950/20 border-white/10 shadow-[0_8px_32px_rgba(139,92,246,0.18)]"
      >
        <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-purple-600/10 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-52 w-52 rounded-full bg-indigo-600/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                SkillProof Member
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
                {displayName}
              </span>
              !
            </h1>

            <p className="text-gray-300 text-sm max-w-xl leading-relaxed">
              Your AI career workspace is ready. Tailor resumes, practice voice mocks, track coding milestones, and find internships all in one unified dashboard.
            </p>

            {targetRole ? (
              <div className="flex items-center gap-2.5 pt-1">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Target Role:</span>
                <span className="bg-purple-500/15 border border-purple-500/30 text-purple-200 px-3 py-1 rounded-lg text-xs font-bold shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                  {targetRole}
                </span>
              </div>
            ) : (
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors pt-1"
              >
                Complete profile configuration
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {/* Quick Action buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <Link href="/profile" passHref>
              <AnimatedButton variant="secondary" className="w-full sm:w-auto text-center justify-center">
                Configure Profile
              </AnimatedButton>
            </Link>
            <Link href="/dashboard/resume" passHref>
              <AnimatedButton variant="primary" className="w-full sm:w-auto text-center justify-center">
                Build AI Resume
              </AnimatedButton>
            </Link>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
