"use client";

import React, { useState, useTransition, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  Target,
  Zap,
  Clock,
  BookOpen,
  ArrowRight,
  RefreshCw,
  FileText,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { GapReport, GapItem, GapState } from "@/lib/gap-report/engine";

interface GapReportClientProps {
  initialGapReport: GapReport | null;
  hasAssessment: boolean;
  targetRole: string;
}

const STATE_CONFIG: Record<
  GapState,
  { label: string; color: string; border: string; bg: string; icon: React.ReactNode }
> = {
  SUPPORTED: {
    label: "SUPPORTED",
    color: "text-emerald-300",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  },
  PARTIAL: {
    label: "PARTIAL",
    color: "text-amber-300",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
  },
  CLAIMED_ONLY: {
    label: "CLAIMED ONLY",
    color: "text-blue-300",
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    icon: <Info className="w-3.5 h-3.5 text-blue-400" />,
  },
  NOT_EVIDENCED: {
    label: "NOT EVIDENCED",
    color: "text-red-300",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    icon: <XCircle className="w-3.5 h-3.5 text-red-400" />,
  },
};

const PRIORITY_CONFIG = {
  HIGH: { label: "HIGH", color: "text-red-300", bg: "bg-red-500/10 border-red-500/20" },
  MEDIUM: { label: "MEDIUM", color: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/20" },
  LOW: { label: "LOW", color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/20" },
};

const READINESS_CONFIG = {
  "Job-Ready": { color: "text-emerald-400", bar: "bg-emerald-500", label: "Job-Ready" },
  "Nearly Ready": { color: "text-indigo-400", bar: "bg-indigo-500", label: "Nearly Ready" },
  "Needs Work": { color: "text-amber-400", bar: "bg-amber-500", label: "Needs Work" },
  "Significant Gaps": { color: "text-red-400", bar: "bg-red-500", label: "Significant Gaps" },
};

function GapItemCard({ gap }: { gap: GapItem }) {
  const [expanded, setExpanded] = useState(false);
  const sc = STATE_CONFIG[gap.state];
  const pc = PRIORITY_CONFIG[gap.microtask.priority];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
      >
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${sc.color} ${sc.border} ${sc.bg}`}
        >
          {sc.icon}
          {sc.label}
        </span>

        <span className="flex-1 text-sm font-semibold text-white truncate">{gap.skill}</span>

        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${pc.color} ${pc.bg}`}
        >
          {pc.label}
        </span>

        <span className="text-[9px] text-gray-500 shrink-0 hidden sm:block">
          {gap.importance === "REQUIRED" ? "Required" : gap.importance === "PREFERRED" ? "Preferred" : "Nice-to-have"}
        </span>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3">
              {/* Evidence summary */}
              <div className="text-xs text-gray-300 leading-relaxed">{gap.evidenceSummary}</div>

              {/* Citation links */}
              {gap.citationUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {gap.citationUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View evidence {i + 1}
                    </a>
                  ))}
                </div>
              )}

              {/* Microtask */}
              {gap.state !== "SUPPORTED" && (
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span className="text-xs font-bold text-violet-300">{gap.microtask.title}</span>
                    <span className="ml-auto flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock className="w-3 h-3" />
                      ~{gap.microtask.estimatedHours}h
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300">{gap.microtask.description}</p>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Steps</span>
                    <ol className="space-y-1">
                      {gap.microtask.steps.map((step, i) => (
                        <li key={i} className="flex gap-2 text-[11px] text-gray-300">
                          <span className="shrink-0 w-4 h-4 rounded-full bg-violet-500/20 text-violet-300 text-[9px] flex items-center justify-center font-bold mt-0.5">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="text-[10px] text-gray-400">
                      <span className="font-bold text-gray-300">Deliverable: </span>
                      {gap.microtask.deliverable}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      <span className="font-bold text-gray-300">✓ Validation: </span>
                      {gap.microtask.validation}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function GapReportClient({
  initialGapReport,
  hasAssessment,
  targetRole,
}: GapReportClientProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [report, setReport] = useState<GapReport | null>(initialGapReport);
  const [isGenerating, startGenerating] = useTransition();
  const [filter, setFilter] = useState<"all" | GapState>("all");
  const [importanceFilter, setImportanceFilter] = useState<"all" | "REQUIRED" | "PREFERRED">("all");

  const handleGenerate = () => {
    if (!jobDescription.trim() || jobDescription.trim().length < 30) {
      toast.error("Please paste a job description (at least 30 characters).");
      return;
    }

    startGenerating(async () => {
      try {
        const res = await fetch("/api/gap-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription: jobDescription.trim() }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to generate gap report.");
        }

        const data: GapReport = await res.json();
        setReport(data);
        toast.success("Gap report generated!");
      } catch (err: any) {
        toast.error(err.message || "Failed to generate gap report.");
      }
    });
  };

  const filteredGaps = useMemo(() => {
    if (!report) return [];
    return report.gaps.filter((g) => {
      const stateMatch = filter === "all" || g.state === filter;
      const impMatch = importanceFilter === "all" || g.importance === importanceFilter;
      return stateMatch && impMatch;
    });
  }, [report, filter, importanceFilter]);

  const rc = report ? READINESS_CONFIG[report.summary.readinessLabel] : null;

  return (
    <div className="space-y-6">
      {/* Input card */}
      <GlassCard className="p-6 sm:p-8 space-y-6 border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-violet-400" />
              Paste Job Description
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              We extract technical requirements and match them against your{" "}
              {hasAssessment
                ? "verified skill assessment"
                : "resume skills (run your assessment first for best results)"}
              .
            </p>
          </div>
          {report && (
            <button
              onClick={() => { setReport(null); setJobDescription(""); }}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer w-fit"
            >
              <RefreshCw className="w-3.5 h-3.5 text-violet-400" />
              New Analysis
            </button>
          )}
        </div>

        {!hasAssessment && (
          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[11px] text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              You haven&apos;t run your Evidence-Based Assessment yet. Gap results will be limited to resume claims without GitHub evidence.{" "}
              <a href="/dashboard/assessment" className="underline text-amber-300 hover:text-amber-200">
                Run assessment first →
              </a>
            </span>
          </div>
        )}

        {!report && (
          <div className="space-y-3">
            <textarea
              id="gap-report-jd-input"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste a complete job description here — e.g. from LinkedIn, Naukri, or a company careers page. Include requirements and responsibilities sections for best results..."
              rows={10}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 resize-none transition-colors"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                {jobDescription.length}/15000 characters
              </span>
              <button
                id="gap-report-generate-btn"
                onClick={handleGenerate}
                disabled={isGenerating || jobDescription.trim().length < 30}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-violet-500/20 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Generate Gap Report
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Results */}
      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: "Total Requirements", value: report.summary.totalRequirements, color: "text-gray-300" },
                { label: "Supported", value: report.summary.supported, color: "text-emerald-400" },
                { label: "Partial", value: report.summary.partial, color: "text-amber-400" },
                { label: "Claimed Only", value: report.summary.claimedOnly, color: "text-blue-400" },
                { label: "Not Evidenced", value: report.summary.notEvidenced, color: "text-red-400" },
              ].map((stat) => (
                <GlassCard key={stat.label} className="p-4 text-center border-white/5">
                  <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{stat.label}</div>
                </GlassCard>
              ))}
            </div>

            {/* Readiness score */}
            <GlassCard className="p-6 border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-violet-400" />
                    Job Readiness Score
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {report.jobTitle}{report.jobCompany ? ` · ${report.jobCompany}` : ""}
                  </p>
                </div>
                <span className={`text-3xl font-black ${rc?.color}`}>
                  {report.summary.readinessScore}
                  <span className="text-base font-semibold text-gray-500">/100</span>
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${report.summary.readinessScore}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${rc?.bar} shadow-sm`}
                  />
                </div>
                <div className={`text-xs font-bold ${rc?.color}`}>{rc?.label}</div>
              </div>

              {/* AI coaching tip */}
              {(report as any).aiCoachingTip && (
                <div className="p-3 rounded-xl border border-violet-500/20 bg-violet-500/5 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-200 leading-relaxed">{(report as any).aiCoachingTip}</p>
                </div>
              )}

              {/* Top priority actions */}
              {report.topPriorityActions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Top Priority Actions
                  </span>
                  <ul className="space-y-1.5">
                    {report.topPriorityActions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-gray-300">
                        <ArrowRight className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </GlassCard>

            {/* Strengths */}
            {report.strengths.length > 0 && (
              <GlassCard className="p-5 border-white/5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Verified Strengths
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="text-[11px] text-gray-300 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}

            {/* Gap items */}
            <GlassCard className="p-5 border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-violet-400" />
                  Skill-by-Skill Gap Analysis
                </h3>
                <div className="flex flex-wrap gap-2">
                  {/* State filter */}
                  <select
                    id="gap-state-filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="text-[11px] rounded-lg bg-white/5 border border-white/10 text-gray-300 px-2 py-1 focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="all">All States ({report.gaps.length})</option>
                    <option value="NOT_EVIDENCED">Not Evidenced ({report.summary.notEvidenced})</option>
                    <option value="CLAIMED_ONLY">Claimed Only ({report.summary.claimedOnly})</option>
                    <option value="PARTIAL">Partial ({report.summary.partial})</option>
                    <option value="SUPPORTED">Supported ({report.summary.supported})</option>
                  </select>
                  <select
                    id="gap-importance-filter"
                    value={importanceFilter}
                    onChange={(e) => setImportanceFilter(e.target.value as any)}
                    className="text-[11px] rounded-lg bg-white/5 border border-white/10 text-gray-300 px-2 py-1 focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="all">All Importance</option>
                    <option value="REQUIRED">Required Only</option>
                    <option value="PREFERRED">Preferred Only</option>
                  </select>
                </div>
              </div>

              {filteredGaps.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No skills match the current filter.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredGaps.map((gap) => (
                    <GapItemCard key={gap.skill} gap={gap} />
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Notice */}
            <p className="text-[10px] text-gray-500 text-center leading-relaxed max-w-3xl mx-auto">
              {report.notice}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
