"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, FileText, ScanSearch, Video } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

interface RealStatsProps {
  stats: {
    totalUsers: number;
    totalResumes: number;
    totalAtsScans: number;
    totalInterviews: number;
  };
}

export default function RealStats({ stats }: RealStatsProps) {
  const cards = [
    {
      label: "Active Students",
      value: stats.totalUsers.toLocaleString(),
      description: "Building their futures on SkillProof",
      icon: Users,
      glow: "purple" as const,
    },
    {
      label: "Resumes Built",
      value: stats.totalResumes.toLocaleString(),
      description: "ATS-optimized resume drafts",
      icon: FileText,
      glow: "violet" as const,
    },
    {
      label: "ATS Scans Executed",
      value: stats.totalAtsScans.toLocaleString(),
      description: "Compatibility reports generated",
      icon: ScanSearch,
      glow: "purple" as const,
    },
    {
      label: "Mock Interviews Done",
      value: stats.totalInterviews.toLocaleString(),
      description: "Completed voice and chat practice",
      icon: Video,
      glow: "indigo" as const,
    },
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Built for Students,{" "}
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Proven by Metrics
            </span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Real-time aggregate activity across SkillProof. No arbitrary claims—just transparent platform metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <GlassCard
                glowColor={card.glow}
                className="p-6 flex flex-col justify-between h-52 group hover:scale-[1.03] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {card.label}
                  </span>
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                    <card.icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-4xl font-extrabold text-white tracking-tight bg-gradient-to-b from-white to-gray-300 bg-clip-text">
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    {card.description}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
