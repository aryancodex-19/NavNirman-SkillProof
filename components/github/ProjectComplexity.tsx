"use client";

import React from "react";
import { motion } from "framer-motion";
import { FolderGit2, Star, GitFork, Eye, Users, UserPlus } from "lucide-react";

interface ProjectComplexityProps {
  data: {
    score: number;
    totalRepos: number;
    totalStars: number;
    totalForks: number;
    totalWatchers: number;
    topRepos: {
      name: string;
      description: string | null;
      url: string;
      stars: number;
      forks: number;
      language: string | null;
      size: number;
      sizeCategory: "small" | "medium" | "large";
      topics: string[];
      updatedAt: string;
    }[];
    sizeDistribution: { small: number; medium: number; large: number };
    qualityScore: number;
    topics: string[];
    followers: number;
    following: number;
  };
}

const SIZE_COLORS = {
  small: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  large: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
};

export default function ProjectComplexity({ data }: ProjectComplexityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl p-6"
    >
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-pink-500/10 rounded-xl border border-pink-500/20">
          <FolderGit2 className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Project Complexity</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Repository analysis & metrics
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Repos", value: data.totalRepos, icon: FolderGit2, color: "text-pink-400" },
          { label: "Stars", value: data.totalStars, icon: Star, color: "text-yellow-400" },
          { label: "Forks", value: data.totalForks, icon: GitFork, color: "text-indigo-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center"
          >
            <Icon className={`w-3.5 h-3.5 ${color} mx-auto mb-1.5`} />
            <p className="text-lg font-black text-white">{value}</p>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Social Stats */}
      <div className="flex items-center gap-4 mb-5 px-1">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-400">
            <strong className="text-gray-200">{data.followers}</strong> followers
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <UserPlus className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-400">
            <strong className="text-gray-200">{data.following}</strong> following
          </span>
        </div>
      </div>

      {/* Size Distribution */}
      <div className="mb-5 space-y-2">
        <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
          Project Size Distribution
        </p>
        <div className="flex gap-2">
          {(["small", "medium", "large"] as const).map((size) => {
            const count = data.sizeDistribution[size];
            const total = data.totalRepos || 1;
            const pct = Math.round((count / total) * 100);
            const colors = SIZE_COLORS[size];
            return (
              <div
                key={size}
                className={`flex-1 ${colors.bg} border ${colors.border} rounded-xl p-2.5 text-center`}
              >
                <p className={`text-lg font-black ${colors.text}`}>{count}</p>
                <p className="text-[10px] text-gray-500 font-medium capitalize">
                  {size} ({pct}%)
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Repos */}
      {data.topRepos.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
            Top Repositories
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none">
            {data.topRepos.slice(0, 5).map((repo, i) => (
              <motion.a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-semibold text-gray-200 group-hover:text-indigo-400 transition-colors truncate">
                    {repo.name}
                  </p>
                  {repo.description && (
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                      {repo.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {repo.language && (
                    <span className="text-[10px] text-gray-400 font-medium">
                      {repo.language}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-gray-300 font-semibold">
                      {repo.stars}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${
                      SIZE_COLORS[repo.sizeCategory].bg
                    } ${SIZE_COLORS[repo.sizeCategory].text} ${
                      SIZE_COLORS[repo.sizeCategory].border
                    }`}
                  >
                    {repo.sizeCategory}
                  </span>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      )}

      {/* Score Indicator */}
      <div className="mt-5 flex items-center justify-between px-1">
        <span className="text-xs text-gray-500 font-medium">Project Score</span>
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.score}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
            />
          </div>
          <span className="text-sm font-bold text-pink-400">{data.score}</span>
        </div>
      </div>
    </motion.div>
  );
}
