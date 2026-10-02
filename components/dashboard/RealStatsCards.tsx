"use client";

import React from "react";
import { FileText, Award, Calendar, Zap } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

interface RealStatsCardsProps {
  resumesCount: number;
  avgAtsScore: string;
  interviewSessionsCount: number;
  maxStreak: number;
}

export default function RealStatsCards({
  resumesCount,
  avgAtsScore,
  interviewSessionsCount,
  maxStreak,
}: RealStatsCardsProps) {
  const stats = [
    {
      label: "Resumes Created",
      value: resumesCount.toString(),
      sublabel: resumesCount > 0 ? "Optimized draft stored" : "None created yet",
      icon: FileText,
      glow: "indigo" as const,
    },
    {
      label: "Average ATS Score",
      value: avgAtsScore,
      sublabel: avgAtsScore !== "—" ? "Targeting 80%+" : "Scan to measure score",
      icon: Award,
      glow: "violet" as const,
    },
    {
      label: "Mock Interviews Done",
      value: interviewSessionsCount.toString(),
      sublabel: interviewSessionsCount > 0 ? "Excellent practice" : "No tests taken yet",
      icon: Calendar,
      glow: "pink" as const,
    },
    {
      label: "Coding Streak",
      value: `${maxStreak}d`,
      sublabel: maxStreak > 0 ? "Consistency active" : "Solve problems to start",
      icon: Zap,
      glow: "indigo" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <GlassCard
          key={stat.label}
          glowColor={stat.glow}
          className="p-5 flex flex-col justify-between h-full bg-white/[0.02]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {stat.label}
            </span>
            <stat.icon className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-white">
              {stat.value}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">
              {stat.sublabel}
            </p>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
