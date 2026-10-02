"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Workflow,
  Container,
  GitCommit,
  Layers,
  FileCode,
  ShieldCheck,
} from "lucide-react";
import { DiscoveredEvidence } from "@/app/api/github/analysis/route";

interface RepoEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  repo: {
    name: string;
    fullName?: string;
    description: string | null;
    url: string;
    stars: number;
    forks: number;
    language: string | null;
    evidence?: DiscoveredEvidence;
  } | null;
}

export default function RepoEvidenceModal({
  isOpen,
  onClose,
  repo,
}: RepoEvidenceModalProps) {
  if (!isOpen || !repo) return null;

  const evidence = repo.evidence;
  const tests = evidence?.tests || [];
  const ciWorkflows = evidence?.ciWorkflows || [];
  const deploymentConfigs = evidence?.deploymentConfigs || [];
  const manifests = evidence?.packageManifests || [];
  const commits = evidence?.recentCommits || [];
  const languages = evidence?.languages || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 z-10 text-white scrollbar-none"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/10 pb-5 mb-6">
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Evidence Audit
                </span>
                {repo.language && (
                  <span className="text-xs font-medium text-gray-400">
                    Primary: {repo.language}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-1">
                {repo.name}
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-400 transition-colors"
                  title="View repository on GitHub"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </h2>
              {repo.description && (
                <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
                  {repo.description}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* 1. Automated Tests Evidence */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Test Suites & Files</h3>
                    <p className="text-[10px] text-gray-500">
                      Automated testing artifacts detected in repository tree
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    tests.length > 0
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                  }`}
                >
                  {tests.length > 0 ? `${tests.length} Discovered` : "None Found"}
                </span>
              </div>

              {tests.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {tests.map((test, idx) => (
                    <a
                      key={idx}
                      href={test.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] hover:bg-emerald-500/5 border border-white/5 hover:border-emerald-500/20 transition-all group"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-mono font-medium text-gray-300 group-hover:text-emerald-400 truncate">
                          {test.name}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">{test.path}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400/80 px-1.5 py-0.5 rounded bg-emerald-500/10 shrink-0">
                        {test.framework || "Test"}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.01] border border-white/5 text-gray-500 text-xs">
                  <AlertCircle className="w-4 h-4 text-gray-500 shrink-0" />
                  <span>No test files (*.test.ts, test_*.py, etc.) detected in the scanned file tree.</span>
                </div>
              )}
            </div>

            {/* 2. CI/CD Workflows & Deployment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CI/CD */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">CI/CD Workflows</h3>
                  </div>
                  <span className="text-xs text-gray-400 font-bold">
                    {ciWorkflows.length}
                  </span>
                </div>

                {ciWorkflows.length > 0 ? (
                  <div className="space-y-1.5">
                    {ciWorkflows.map((wf, idx) => (
                      <a
                        key={idx}
                        href={wf.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-indigo-500/5 border border-white/5 hover:border-indigo-500/20 transition-all group text-xs"
                      >
                        <span className="font-mono text-gray-300 group-hover:text-indigo-400 truncate">
                          {wf.name}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-indigo-400" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No .github/workflows detected.</p>
                )}
              </div>

              {/* Deployment / Container */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Container className="w-4 h-4 text-pink-400" />
                    <h3 className="text-sm font-bold text-white">Deployment & Containers</h3>
                  </div>
                  <span className="text-xs text-gray-400 font-bold">
                    {deploymentConfigs.length}
                  </span>
                </div>

                {deploymentConfigs.length > 0 ? (
                  <div className="space-y-1.5">
                    {deploymentConfigs.map((cfg, idx) => (
                      <a
                        key={idx}
                        href={cfg.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-pink-500/5 border border-white/5 hover:border-pink-500/20 transition-all group text-xs"
                      >
                        <span className="font-mono text-gray-300 group-hover:text-pink-400 truncate">
                          {cfg.name}
                        </span>
                        <span className="text-[10px] text-pink-400 px-1.5 py-0.5 rounded bg-pink-500/10">
                          {cfg.type}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No Docker/deploy configs found.</p>
                )}
              </div>
            </div>

            {/* Manifests Section */}
            {manifests.length > 0 && (
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Project & Build Manifests</h3>
                  </div>
                  <span className="text-xs text-gray-400 font-bold">
                    {manifests.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {manifests.map((m, idx) => (
                    <a
                      key={idx}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.02] hover:bg-amber-500/5 border border-white/5 hover:border-amber-500/20 text-xs font-mono text-gray-300 hover:text-amber-400 transition-all group"
                    >
                      <span>{m.name}</span>
                      <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-amber-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Multi-Language Byte Breakdown */}
            {languages.length > 0 && (
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-bold text-white">Repository Languages</h3>
                  </div>
                  <span className="text-xs text-gray-400 font-bold">
                    {languages.length} Languages
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {languages.map((l) => (
                    <div
                      key={l.name}
                      className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-300">{l.name}</span>
                        <span className="text-[10px] font-bold text-violet-400">{l.percentage}%</span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono">
                        {(l.bytes / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Recent Author Commits */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Recent Verified Commits</h3>
                </div>
                <span className="text-xs text-gray-400 font-bold">
                  {commits.length} Recent
                </span>
              </div>

              {commits.length > 0 ? (
                <div className="space-y-2">
                  {commits.map((c) => (
                    <a
                      key={c.sha}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 transition-all group"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-xs font-medium text-gray-200 group-hover:text-indigo-400 truncate">
                          {c.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                          <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-gray-300">
                            {c.shortSha}
                          </span>
                          {c.date && (
                            <span>{new Date(c.date).toLocaleDateString()}</span>
                          )}
                          {c.authorVerified && (
                            <span className="flex items-center gap-0.5 text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Author Verified
                            </span>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-indigo-400 shrink-0" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No recent commit history retrieved for this repository.</p>
              )}
            </div>

            {/* Disclaimer & Transparency Footer */}
            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3 text-xs text-gray-400">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-gray-300">Evidence Transparency Notice</p>
                <p className="text-[11px] leading-relaxed text-gray-400">
                  This audit reflects static artifacts discovered in public branches. The presence of test files confirms the existence of test infrastructure but does not verify runtime pass/fail execution.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
