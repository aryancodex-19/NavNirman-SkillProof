import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import AnimatedHero from "@/components/home/AnimatedHero";
import RealStats from "@/components/home/RealStats";
import FeaturesGrid from "@/components/home/FeaturesGrid";
import HowItWorks from "@/components/home/HowItWorks";
import Testimonials from "@/components/home/Testimonials";
import CTA from "@/components/home/CTA";

export const metadata = {
  title: "CareerOS | AI-Powered Student Career Workspace",
  description:
    "From learning to hiring, CareerOS is the unified AI workspace that matches CS students to internships, builds resumes, audits GitHub activity, scans ATS scores, and coaches mock voice interviews.",
};

export default async function HomePage() {
  const [totalUsers, totalResumes, totalAtsScans, interviewSessionsCount, voiceInterviewsCount] = await Promise.all([
    prisma.user.count(),
    prisma.resume.count(),
    prisma.aTSScan.count(),
    prisma.interviewSession.count(),
    prisma.voiceInterview.count(),
  ]);

  const stats = {
    totalUsers: totalUsers || 0,
    totalResumes: totalResumes || 0,
    totalAtsScans: totalAtsScans || 0,
    totalInterviews: (interviewSessionsCount || 0) + (voiceInterviewsCount || 0),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ═══ NAVIGATION ═══ */}
      <nav className="fixed top-0 w-full z-50 bg-zinc-950/40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/10">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              Career<span className="text-indigo-400">OS</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm font-semibold text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 px-4 py-2 rounded-xl transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <AnimatedHero />

      {/* Real Stats Section */}
      <RealStats stats={stats} />

      {/* Features Grid (9 modules) */}
      <FeaturesGrid />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <CTA />

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950/40 py-12 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-6 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold">
              AI
            </div>
            <span className="font-extrabold text-white">CareerOS</span>
          </div>
          <p>&copy; {new Date().getFullYear()} CareerOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}