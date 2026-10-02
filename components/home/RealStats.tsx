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
      description: "Building their futures on CareerOS",
      icon: Users,
      glow: "indigo" as const,
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
      glow: "pink" as const,
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
          <h2 className="text-3xl font-black text-white">
            Built by Students, Proven by Metrics
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Real-time aggregate activity across CareerOS. No arbitrary assertions—just absolute platform engagement numbers.
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
                className="p-6 flex flex-col justify-between h-48 group hover:scale-[1.03] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {card.label}
                  </span>
                  <card.icon className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="mt-6">
                  <p className="text-4xl font-black text-white tracking-tight">
                    {card.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-2 font-medium">
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
