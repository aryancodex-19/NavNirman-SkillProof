"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FolderGit2,
  Star,
  GitFork,
  Users,
  UserPlus,
  FlaskConical,
  Workflow,
  Container,
  ExternalLink,
  Search,
} from "lucide-react";
import { DiscoveredEvidence } from "@/app/api/github/analysis/route";
import RepoEvidenceModal from "./RepoEvidenceModal";

interface RepoItem {
  name: string;
  fullName?: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  size: number;
  sizeCategory: "small" | "medium" | "large";
  topics: string[];
  updatedAt: string;
  evidence?: DiscoveredEvidence;
}

interface ProjectComplexityProps {
  data: {
    score: number;
    totalRepos: number;
    totalStars: number;
    totalForks: number;
    totalWatchers: number;
    topRepos: RepoItem[];
    sizeDistribution: { small: number; medium: number; large: number };
    qualityScore: number;
    topics: string[];
    followers: number;
    following: number;
  };
}

const SIZE_COLORS = {
  small: { bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/20" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/20" },
  large: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/20" },
};

export default function ProjectComplexity({ data }: ProjectComplexityProps) {
  const [selectedRepo, setSelectedRepo] = useState<RepoItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInspect = (repo: RepoItem, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedRepo(repo);
    setIsModalOpen(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(139,92,246,0.12)]"
      >
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/20 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-500/10 rounded-xl border border-pink-500/20 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Project Complexity & Evidence</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Repository structure, tests & artifacts
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
            {data.totalRepos} Repositories
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Repos", value: data.totalRepos, icon: FolderGit2, color: "text-pink-400" },
            { label: "Stars", value: data.totalStars, icon: Star, color: "text-yellow-400" },
            { label: "Forks", value: data.totalForks, icon: GitFork, color: "text-purple-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center"
            >
              <Icon className={`w-3.5 h-3.5 ${color} mx-auto mb-1.5`} />
              <p className="text-lg font-black text-white">{value}</p>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Social Stats */}
        <div className="flex items-center gap-4 mb-5 px-1">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-300">
              <strong className="text-white">{data.followers}</strong> followers
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-300">
              <strong className="text-white">{data.following}</strong> following
            </span>
          </div>
        </div>

        {/* Size Distribution */}
        <div className="mb-5 space-y-2">
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
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
                  <p className="text-[10px] text-gray-400 font-medium capitalize">
                    {size} ({pct}%)
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Repos with Evidence Badges */}
        {data.topRepos.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                Audited Repositories & Evidence
              </p>
              <span className="text-[10px] text-purple-400 font-medium">
                Click repo to inspect evidence
              </span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 scrollbar-none">
              {data.topRepos.slice(0, 6).map((repo, i) => {
                const hasTests = (repo.evidence?.tests?.length || 0) > 0;
                const hasCI = (repo.evidence?.ciWorkflows?.length || 0) > 0;
                const hasDeploy = (repo.evidence?.deploymentConfigs?.length || 0) > 0;

                return (
                  <motion.div
                    key={repo.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    onClick={(e) => handleInspect(repo, e)}
                    className="bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:bg-white/[0.05] hover:border-purple-500/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-200 group-hover:text-purple-400 transition-colors truncate">
                            {repo.name}
                          </p>
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Open repository on GitHub"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        {repo.description && (
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {repo.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {repo.language && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            {repo.language}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" />
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
                    </div>

                    {/* Evidence Discovery Indicators */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 flex-wrap">
                      {hasTests ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          <FlaskConical className="w-3 h-3" />
                          {repo.evidence?.tests.length} Test File{repo.evidence?.tests.length === 1 ? "" : "s"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded-md">
                          No tests detected
                        </span>
                      )}

                      {hasCI && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                          <Workflow className="w-3 h-3" />
                          CI Workflow
                        </span>
                      )}

                      {hasDeploy && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-md">
                          <Container className="w-3 h-3" />
                          Docker / Deploy
                        </span>
                      )}

                      <span className="ml-auto text-[10px] text-purple-400/80 group-hover:text-purple-300 flex items-center gap-1 font-semibold">
                        <Search className="w-3 h-3" /> Inspect Evidence
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Score Indicator */}
        <div className="mt-5 flex items-center justify-between px-1">
          <span className="text-xs text-gray-400 font-medium">Project Score</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.score}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.4)]"
              />
            </div>
            <span className="text-sm font-bold text-pink-400">{data.score}</span>
          </div>
        </div>
      </motion.div>

      {/* Evidence Modal */}
      <RepoEvidenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        repo={selectedRepo}
      />
    </>
  );
}
