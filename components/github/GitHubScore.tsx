"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  GitBranch,
  BarChart3,
  FolderGit2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowUpRight,
} from "lucide-react";

interface GitHubScoreProps {
  overallScore: number;
  activityScore: number;
  languageScore: number;
  projectScore: number;
  docScore: number;
  level: { label: string; color: string };
  recommendations: {
    category: string;
    priority: "high" | "medium" | "low";
    message: string;
  }[];
}

const CATEGORY_META = {
  Activity: {
    icon: GitBranch,
    gradient: "from-purple-500 to-indigo-500",
    color: "text-purple-400",
    weight: "30%",
  },
  Languages: {
    icon: BarChart3,
    gradient: "from-violet-500 to-purple-400",
    color: "text-violet-400",
    weight: "20%",
  },
  Projects: {
    icon: FolderGit2,
    gradient: "from-pink-500 to-rose-400",
    color: "text-pink-400",
    weight: "30%",
  },
  Documentation: {
    icon: FileText,
    gradient: "from-emerald-500 to-teal-400",
    color: "text-emerald-400",
    weight: "20%",
  },
};

const PRIORITY_STYLES = {
  high: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: AlertTriangle,
    iconColor: "text-red-400",
    label: "High Priority",
    labelBg: "bg-red-500/15 text-red-300 border border-red-500/20",
  },
  medium: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: Info,
    iconColor: "text-amber-400",
    label: "Medium",
    labelBg: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
  },
  low: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: CheckCircle2,
    iconColor: "text-purple-400",
    label: "Suggestion",
    labelBg: "bg-purple-500/15 text-purple-300 border border-purple-500/20",
  },
};

// Animated circular gauge with drop shadow glow
function CircularGauge({
  score,
  color,
  size = 180,
}: {
  score: number;
  color: string;
  size?: number;
}) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ filter: "drop-shadow(0 0 16px rgba(168, 85, 247, 0.4))" }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color || "#a855f7"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-black text-white bg-gradient-to-b from-white via-white to-gray-300 bg-clip-text text-transparent"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {score}
        </motion.span>
        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
          out of 100
        </span>
      </div>
    </div>
  );
}

export default function GitHubScore({
  overallScore,
  activityScore,
  languageScore,
  projectScore,
  docScore,
  level,
  recommendations,
}: GitHubScoreProps) {
  const scores = [
    { key: "Activity" as const, score: activityScore },
    { key: "Languages" as const, score: languageScore },
    { key: "Projects" as const, score: projectScore },
    { key: "Documentation" as const, score: docScore },
  ];

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(139,92,246,0.15)]"
      >
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/20 to-transparent pointer-events-none" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
          {/* Circular Gauge */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <CircularGauge score={overallScore} color={level.color} />
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
            >
              <Trophy
                className="w-4 h-4"
                style={{ color: level.color }}
              />
              <span
                className="text-sm font-bold"
                style={{ color: level.color }}
              >
                {level.label}
              </span>
            </motion.div>
          </div>

          {/* Category Breakdown */}
          <div className="flex-1 w-full space-y-4">
            <div className="mb-2">
              <h3 className="text-lg font-bold text-white">
                GitHub Developer Score
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Weighted composite of 4 categories
              </p>
            </div>

            {scores.map(({ key, score }, i) => {
              const meta = CATEGORY_META[key];
              const Icon = meta.icon;
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                      <span className="text-sm font-semibold text-gray-300">
                        {key}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        ({meta.weight})
                      </span>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {score}
                      <span className="text-gray-500">/100</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{
                        duration: 1,
                        ease: "easeOut",
                        delay: 0.3 + i * 0.15,
                      }}
                      className={`h-full bg-gradient-to-r ${meta.gradient} rounded-full shadow-[0_0_8px_rgba(168,85,247,0.4)]`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(139,92,246,0.12)]"
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/20 to-transparent pointer-events-none" />

          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Recommendations
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {recommendations.length} improvement suggestions
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec, i) => {
              const style = PRIORITY_STYLES[rec.priority];
              const PriorityIcon = style.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  className={`${style.bg} border ${style.border} rounded-xl p-4`}
                >
                  <div className="flex items-start gap-3">
                    <PriorityIcon
                      className={`w-4 h-4 ${style.iconColor} mt-0.5 shrink-0`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-200">
                          {rec.category}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${style.labelBg}`}
                        >
                          {style.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {rec.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
