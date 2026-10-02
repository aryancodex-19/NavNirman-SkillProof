"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle2, XCircle, FileCode, BookOpen, Scale } from "lucide-react";

interface DocQualityProps {
  data: {
    score: number;
    totalChecked: number;
    readmePercentage: number;
    licensePercentage: number;
    descriptionPercentage: number;
    setupPercentage: number;
    repoDetails: {
      name: string;
      hasReadme: boolean;
      hasLicense: boolean;
      hasDescription: boolean;
      readmeLength: number;
      hasSetupInstructions: boolean;
      docScore: number;
    }[];
  };
}

interface MetricBarProps {
  label: string;
  icon: React.ElementType;
  percentage: number;
  color: string;
  delay: number;
}

function MetricBar({ label, icon: Icon, percentage, color, delay }: MetricBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span className="text-xs font-semibold text-gray-300">{label}</span>
        </div>
        <span className="text-xs font-bold text-gray-400">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut", delay }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color.includes("emerald") ? "#10b981" : color.includes("indigo") ? "#6366f1" : color.includes("amber") ? "#f59e0b" : "#ec4899"}, ${color.includes("emerald") ? "#34d399" : color.includes("indigo") ? "#818cf8" : color.includes("amber") ? "#fbbf24" : "#f472b6"})`,
          }}
        />
      </div>
    </div>
  );
}

export default function DocQuality({ data }: DocQualityProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-400";
    if (score >= 40) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl p-6"
    >
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <FileText className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Documentation Quality</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Analyzed {data.totalChecked} repositories
            </p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-4 mb-6">
        <MetricBar
          label="README Coverage"
          icon={BookOpen}
          percentage={data.readmePercentage}
          color="text-emerald-400"
          delay={0.3}
        />
        <MetricBar
          label="License Presence"
          icon={Scale}
          percentage={data.licensePercentage}
          color="text-indigo-400"
          delay={0.4}
        />
        <MetricBar
          label="Descriptions"
          icon={FileCode}
          percentage={data.descriptionPercentage}
          color="text-amber-400"
          delay={0.5}
        />
        <MetricBar
          label="Setup Instructions"
          icon={FileText}
          percentage={data.setupPercentage}
          color="text-pink-400"
          delay={0.6}
        />
      </div>

      {/* Repo Details */}
      {data.repoDetails.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
            Per-Repository Scores
          </p>
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 scrollbar-none">
            {data.repoDetails.map((repo, i) => (
              <motion.div
                key={repo.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.04 }}
                className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xs font-semibold text-gray-300 truncate">
                    {repo.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {/* Checkmark indicators */}
                  <div className="flex items-center gap-1">
                    {repo.hasReadme ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400/50" />
                    )}
                    {repo.hasLicense ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400/50" />
                    )}
                    {repo.hasSetupInstructions ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400/50" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold ${getScoreColor(repo.docScore)}`}
                  >
                    {repo.docScore}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 pt-1 px-1">
            <span className="text-[9px] text-gray-600 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> README
            </span>
            <span className="text-[9px] text-gray-600 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> License
            </span>
            <span className="text-[9px] text-gray-600 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> Setup
            </span>
          </div>
        </div>
      )}

      {/* Score Indicator */}
      <div className="mt-5 flex items-center justify-between px-1">
        <span className="text-xs text-gray-500 font-medium">
          Documentation Score
        </span>
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.score}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
            />
          </div>
          <span className="text-sm font-bold text-emerald-400">
            {data.score}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
