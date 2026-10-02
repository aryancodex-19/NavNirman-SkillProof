"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  ScanSearch,
  BrainCircuit,
  Briefcase,
  Video,
  Mic,
  Code2,
  Share2,
  GitGraph,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

const MODULES = [
  {
    icon: FileText,
    title: "AI Resume Builder",
    description: "Build ATS-optimized resumes with real-time AI suggestions and premium responsive styles.",
    glow: "indigo" as const,
  },
  {
    icon: ScanSearch,
    title: "ATS Scanner",
    description: "Scan your resume against any target job description and secure a compatibility score breakdown.",
    glow: "violet" as const,
  },
  {
    icon: BrainCircuit,
    title: "AI Career Mentor",
    description: "Map your study pathway, find skill gaps, and explore recommendations from an active AI assistant.",
    glow: "pink" as const,
  },
  {
    icon: Briefcase,
    title: "Internship Finder",
    description: "Scrape and match local internships tailored to your target roles, skills, and geo-location.",
    glow: "indigo" as const,
  },
  {
    icon: Video,
    title: "AI Interview Coach",
    description: "Run custom mock sessions and get instant critiques on your answers and confidence scores.",
    glow: "violet" as const,
  },
  {
    icon: Mic,
    title: "AI Voice Interview",
    description: "Engage in live voice mocks with follow-ups, tone assessment, and vocal analytics.",
    glow: "pink" as const,
  },
  {
    icon: Code2,
    title: "Coding Tracker",
    description: "Log solved problems across LeetCode/Codeforces and monitor streaks and milestones.",
    glow: "indigo" as const,
  },
  {
    icon: Share2,
    title: "LinkedIn Optimizer",
    description: "Audit search keywords, rewrite bio copy, and streamline headlines for recruiter search visibility.",
    glow: "violet" as const,
  },
  {
    icon: GitGraph,
    title: "GitHub Deep Analysis",
    description: "Inspect commits frequency, tech stack composition, and documentation coverage metrics.",
    glow: "pink" as const,
  },
];

export default function FeaturesGrid() {
  return (
    <section className="py-20 relative overflow-hidden bg-zinc-950/20">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-black text-white">
            Everything You Need, in a Single Workspace
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Access 9 purpose-built modules designed to guide you through the entire career cycle—from building assets to getting hired.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map((module, i) => (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <GlassCard
                glowColor={module.glow}
                className="p-8 flex flex-col justify-between h-64 group cursor-pointer hover:border-indigo-500/30"
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all duration-300">
                    <module.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {module.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300 pt-2">
                  <span>Explore Module</span>
                  <span>&rarr;</span>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
