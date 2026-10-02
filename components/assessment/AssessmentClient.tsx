"use client";

import React, { useState, useTransition, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code2,
  Layers,
  ArrowRight,
  RefreshCw,
  GitBranch,
  ShieldAlert,
  Search,
  Check,
  Briefcase,
  ChevronDown,
  Terminal,
  FileCode,
  SlidersHorizontal,
  Info,
  Award,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { TARGET_ROLES, RoleDefinition } from "@/lib/assessment/roles";
import {
  AssessmentResult,
  SkillEvidenceAssessment,
  EvidenceCitation,
  SkillClassification,
  RoleRelevance,
} from "@/lib/assessment/engine";

/**
 * Normalizes an incoming raw or legacy assessment object to guarantee all required
 * classification fields, role metadata, and numeric metrics exist and are non-undefined.
 */
function normalizeAssessmentData(data: any): AssessmentResult | null {
  if (!data || !Array.isArray(data.skills)) return null;

  const skills: SkillEvidenceAssessment[] = data.skills.map((s: any) => {
    const rawClass = typeof s.classification === "string" ? s.classification.toUpperCase() : "";
    let classification: SkillClassification = "CLAIMED-ONLY";
    if (rawClass === "PROVEN" || rawClass === "PARTIAL" || rawClass === "CLAIMED-ONLY") {
      classification = rawClass as SkillClassification;
    } else if (s.hasPublicEvidence) {
      classification = "PROVEN";
    }

    const rawRelevance = typeof s.roleRelevance === "string" ? s.roleRelevance.toUpperCase() : "";
    let roleRelevance: RoleRelevance = "NOT_REQUIRED";
    if (rawRelevance === "CORE" || rawRelevance === "RELEVANT" || rawRelevance === "NOT_REQUIRED") {
      roleRelevance = rawRelevance as RoleRelevance;
    } else if (s.isRoleRelevant) {
      roleRelevance = "CORE";
    }

    const citations = Array.isArray(s.citations) ? s.citations : [];

    return {
      skill: s.skill || "",
      classification,
      roleRelevance,
      isRoleRelevant: roleRelevance !== "NOT_REQUIRED",
      hasPublicEvidence: classification !== "CLAIMED-ONLY",
      evidenceCount: typeof s.evidenceCount === "number" ? s.evidenceCount : citations.length,
      explanation:
        s.explanation ||
        (classification === "PROVEN"
          ? "Verified through direct code artifacts in public repositories."
          : classification === "PARTIAL"
          ? "Preliminary evidence observed in public repositories."
          : "Claimed on resume without public repository evidence."),
      nextStep: s.nextStep || "",
      citations,
      summary: s.summary || s.explanation || "",
    };
  });

  const provenSkillsCount = skills.filter((s) => s.classification === "PROVEN").length;
  const partialSkillsCount = skills.filter((s) => s.classification === "PARTIAL").length;
  const claimedOnlySkillsCount = skills.filter((s) => s.classification === "CLAIMED-ONLY").length;
  const totalClaimedSkills = skills.length;
  const roleRelevantSkillsClaimed = skills.filter((s) => s.roleRelevance === "CORE" || s.isRoleRelevant).length;
  const roleRelevantSkillsWithEvidence = skills.filter(
    (s) => (s.roleRelevance === "CORE" || s.isRoleRelevant) && s.classification !== "CLAIMED-ONLY"
  ).length;
  const evidenceCoveragePercentage =
    totalClaimedSkills > 0 ? Math.round(((provenSkillsCount + partialSkillsCount) / totalClaimedSkills) * 100) : 0;

  return {
    ...data,
    metrics: {
      totalClaimedSkills,
      provenSkillsCount,
      partialSkillsCount,
      claimedOnlySkillsCount,
      skillsWithPublicEvidence: provenSkillsCount + partialSkillsCount,
      skillsWithoutPublicEvidence: claimedOnlySkillsCount,
      roleRelevantSkillsClaimed,
      roleRelevantSkillsWithEvidence,
      evidenceCoveragePercentage,
      totalInspectedRepos: data.metrics?.totalInspectedRepos ?? 0,
      totalTestSuites: data.metrics?.totalTestSuites ?? 0,
      totalCIWorkflows: data.metrics?.totalCIWorkflows ?? 0,
      totalDeploymentConfigs: data.metrics?.totalDeploymentConfigs ?? 0,
      totalVerifiedCommits: data.metrics?.totalVerifiedCommits ?? 0,
    },
    skills,
    roleInsights: {
      observedStrengths: Array.isArray(data.roleInsights?.observedStrengths)
        ? data.roleInsights.observedStrengths
        : [],
      evidenceOpportunities: Array.isArray(data.roleInsights?.evidenceOpportunities)
        ? data.roleInsights.evidenceOpportunities
        : [],
      summary: data.roleInsights?.summary || "",
    },
    notice:
      data.notice ||
      "Assessment is strictly limited to verifiable public repository artifacts and does not claim to evaluate private codebases or unshared repositories.",
  };
}

interface AssessmentClientProps {
  initialResume: {
    id: string;
    title: string;
    skills: string[];
    fullName?: string | null;
  } | null;
  initialGitHubUsername: string;
  initialTargetRole: string;
  initialAssessment: AssessmentResult | null;
}

export default function AssessmentClient({
  initialResume,
  initialGitHubUsername,
  initialTargetRole,
  initialAssessment,
}: AssessmentClientProps) {
  // Wizard state
  const [selectedResume, setSelectedResume] = useState<{
    id?: string;
    title: string;
    skills: string[];
  } | null>(initialResume ? { id: initialResume.id, title: initialResume.title, skills: initialResume.skills } : null);

  const [githubUsername, setGithubUsername] = useState(initialGitHubUsername || "");
  const [targetRole, setTargetRole] = useState(initialTargetRole || TARGET_ROLES[0].name);
  const [customRole, setCustomRole] = useState("");
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isAssessing, startAssessing] = useTransition();

  // Results & active views (normalized to prevent undefined values or stale schemas)
  const [assessment, setAssessment] = useState<AssessmentResult | null>(() =>
    normalizeAssessmentData(initialAssessment)
  );
  const [activeFilter, setActiveFilter] = useState<"all" | "proven" | "partial" | "claimed-only" | "role-core">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  // Sync if initialAssessment prop changes
  useEffect(() => {
    if (initialAssessment) {
      setAssessment(normalizeAssessmentData(initialAssessment));
    }
  }, [initialAssessment]);

  // Resume File Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB.");
      return;
    }

    setIsUploadingResume(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to parse resume.");
      }

      const data = await res.json();
      const extractedSkills = Array.isArray(data.skills) ? data.skills : [];

      if (extractedSkills.length === 0) {
        toast.warning(data.warning || "No recognizable technical skills found in the uploaded PDF. Please verify your skills section or try another PDF.");
      } else {
        toast.success(`Extracted ${extractedSkills.length} technical skills from resume!`);
      }

      setSelectedResume({
        id: data.id || undefined,
        title: file.name,
        skills: extractedSkills,
      });
    } catch (err: any) {
      console.error("Resume upload failed:", err);
      toast.error(err.message || "Failed to upload and parse resume.");
    } finally {
      setIsUploadingResume(false);
    }
  };

  // Run Assessment Action
  const handleRunAssessment = () => {
    const effectiveRole = targetRole === "custom" ? customRole.trim() : targetRole;

    if (!selectedResume || selectedResume.skills.length === 0) {
      toast.error("No technical skills available. Please upload a resume with recognizable technical skills.");
      return;
    }

    if (!githubUsername.trim()) {
      toast.error("Please enter a GitHub username.");
      return;
    }

    if (!effectiveRole) {
      toast.error("Please select or enter a target job role.");
      return;
    }

    startAssessing(async () => {
      try {
        const res = await fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeId: selectedResume.id,
            resumeSkills: selectedResume.skills,
            githubUsername: githubUsername.trim(),
            targetRole: effectiveRole,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to run assessment.");
        }

        const data: AssessmentResult = await res.json();
        setAssessment(normalizeAssessmentData(data));
        toast.success("Skill classification assessment completed!");
      } catch (err: any) {
        console.error("Assessment error:", err);
        toast.error(err.message || "Failed to run assessment.");
      }
    });
  };

  // Dynamically calculate accurate counts based on current skills array
  const filterCounts = useMemo(() => {
    const skills = assessment?.skills || [];
    return {
      all: skills.length,
      proven: skills.filter((s) => s.classification === "PROVEN").length,
      partial: skills.filter((s) => s.classification === "PARTIAL").length,
      claimedOnly: skills.filter((s) => s.classification === "CLAIMED-ONLY").length,
      roleCore: skills.filter((s) => s.roleRelevance === "CORE" || s.isRoleRelevant).length,
    };
  }, [assessment]);

  // Filter skills in report view
  const filteredSkills = useMemo(() => {
    if (!assessment?.skills) return [];
    return assessment.skills.filter((s) => {
      const matchesSearch = s.skill.toLowerCase().includes(searchQuery.toLowerCase().trim());
      if (!matchesSearch) return false;

      const c = (s.classification || "").toUpperCase();
      if (activeFilter === "proven") return c === "PROVEN";
      if (activeFilter === "partial") return c === "PARTIAL";
      if (activeFilter === "claimed-only") return c === "CLAIMED-ONLY";
      if (activeFilter === "role-core") return s.roleRelevance === "CORE" || s.isRoleRelevant;
      return true;
    });
  }, [assessment, activeFilter, searchQuery]);

  const getCitationIcon = (type: EvidenceCitation["type"]) => {
    switch (type) {
      case "test_suite":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case "ci_workflow":
        return <GitBranch className="w-3.5 h-3.5 text-indigo-400" />;
      case "deployment_config":
        return <Layers className="w-3.5 h-3.5 text-violet-400" />;
      case "package_manifest":
        return <FileCode className="w-3.5 h-3.5 text-amber-400" />;
      case "commit":
        return <Terminal className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Code2 className="w-3.5 h-3.5 text-indigo-300" />;
    }
  };

  const getClassificationBadge = (classification: SkillClassification) => {
    switch (classification) {
      case "PROVEN":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1 shadow-sm shadow-emerald-500/10">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            PROVEN
          </span>
        );
      case "PARTIAL":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1 shadow-sm shadow-amber-500/10">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            PARTIAL
          </span>
        );
      case "CLAIMED-ONLY":
      default:
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-300 border border-slate-500/30 font-semibold flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            CLAIMED-ONLY
          </span>
        );
    }
  };

  const getRoleRelevanceBadge = (relevance?: RoleRelevance, isRoleRelevant?: boolean) => {
    if (relevance === "CORE" || (isRoleRelevant && !relevance)) {
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
          Target Role Core
        </span>
      );
    }
    if (relevance === "RELEVANT") {
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold">
          Role Relevant
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* ── Configuration / Input Card ── */}
      <GlassCard className="p-6 sm:p-8 space-y-8 border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
              Evidence Assessment & Classification
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Correlate resume claims against public GitHub code artifacts to classify skills as PROVEN, PARTIAL, or CLAIMED-ONLY.
            </p>
          </div>
          {assessment && (
            <button
              onClick={() => setAssessment(null)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer w-fit"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              Reconfigure Inputs
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1: Resume Input */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] border border-indigo-500/30">
                1
              </span>
              Resume Technical Skills
            </label>

            {selectedResume ? (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-xs font-bold text-white truncate max-w-[150px]">
                      {selectedResume.title}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      selectedResume.skills.length > 0
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {selectedResume.skills.length} skills
                  </span>
                </div>

                {selectedResume.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                    {selectedResume.skills.slice(0, 10).map((skill, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-gray-300"
                      >
                        {skill}
                      </span>
                    ))}
                    {selectedResume.skills.length > 10 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">
                        +{selectedResume.skills.length - 10} more
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>No recognizable technical skills found in this PDF. Please upload another resume.</span>
                  </div>
                )}

                <label className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer block text-center pt-1 border-t border-white/5">
                  <Upload className="w-3 h-3 inline mr-1" />
                  Upload different PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploadingResume}
                  />
                </label>
              </div>
            ) : (
              <label className="border-2 border-dashed border-white/10 hover:border-indigo-500/40 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white/[0.01] hover:bg-white/[0.02] h-40">
                <Upload className="w-6 h-6 text-indigo-400 mb-2" />
                <span className="text-xs font-bold text-white">
                  {isUploadingResume ? "Parsing PDF..." : "Upload Resume PDF"}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1">
                  Max 10MB &bull; Automatic technical skill extraction
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploadingResume}
                />
              </label>
            )}
          </div>

          {/* Step 2: GitHub Input */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] border border-violet-500/30">
                2
              </span>
              GitHub Username
            </label>

            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. torvalds or octocat"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 text-xs text-white placeholder-muted-foreground/50 transition-all outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 space-y-1">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <Info className="w-3 h-3 text-violet-400 shrink-0" />
                  Public repos, tests, CI files, and commits are inspected.
                </p>
                <p className="text-[9px] text-muted-foreground/70 pl-4.5">
                  Private repositories are not accessed.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3: Target Role Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] border border-pink-500/30">
                3
              </span>
              Target Job Role
            </label>

            <div className="space-y-2">
              <div className="relative">
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-white/10 focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 text-xs text-white transition-all outline-none appearance-none cursor-pointer"
                >
                  {TARGET_ROLES.map((role) => (
                    <option key={role.id} value={role.name} className="bg-gray-900 text-white">
                      {role.name} ({role.category})
                    </option>
                  ))}
                  <option value="custom" className="bg-gray-900 text-white">
                    Custom Role...
                  </option>
                </select>
                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
              </div>

              {targetRole === "custom" && (
                <input
                  type="text"
                  placeholder="Enter custom target role (e.g. AI Engineer)"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-pink-500/50 text-xs text-white placeholder-muted-foreground/50 transition-all outline-none"
                />
              )}

              <p className="text-[10px] text-muted-foreground px-1">
                {TARGET_ROLES.find((r) => r.name === targetRole)?.description ||
                  "Evaluates alignment between observed code artifacts and role expectations."}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
            Absence of public evidence is never treated as a lack of competence.
          </p>

          <button
            onClick={handleRunAssessment}
            disabled={isAssessing || isUploadingResume || !selectedResume || !githubUsername.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-600 to-pink-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAssessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Classifying Evidence...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run Classification Assessment
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </GlassCard>

      {/* ── Assessment Report View ── */}
      {assessment && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Assessment Header & Metrics Overview */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-950/80 via-indigo-950/40 to-violet-950/30 p-6 sm:p-8 text-white shadow-2xl backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold">
                    {assessment.targetRole.name}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white/5 text-gray-300 border border-white/10 text-[11px] font-medium flex items-center gap-1.5">
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                    github.com/{assessment.githubUsername}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Assessed {new Date(assessment.assessedAt).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Skill Evidence Classification Report
                </h2>
                <p className="text-xs text-gray-300 max-w-3xl leading-relaxed">
                  {assessment.roleInsights.summary}
                </p>
              </div>

              <div className="flex flex-col items-start md:items-end gap-1 shrink-0 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Evidence Visibility Coverage
                </span>
                <span className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                  {assessment.metrics.evidenceCoveragePercentage}%
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {assessment.metrics.provenSkillsCount} PROVEN &bull; {assessment.metrics.partialSkillsCount} PARTIAL of {assessment.metrics.totalClaimedSkills} total
                </span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold">Claimed Skills</span>
                <p className="text-lg font-bold text-white">{assessment.metrics.totalClaimedSkills}</p>
                <p className="text-[9px] text-indigo-400 font-medium">Resume extracted</p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/20 space-y-1">
                <span className="text-[10px] text-emerald-400 font-semibold">PROVEN</span>
                <p className="text-lg font-bold text-emerald-400">{assessment.metrics.provenSkillsCount}</p>
                <p className="text-[9px] text-emerald-400/80 font-medium">Direct code proof</p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/[0.03] border border-amber-500/20 space-y-1">
                <span className="text-[10px] text-amber-400 font-semibold">PARTIAL</span>
                <p className="text-lg font-bold text-amber-300">{assessment.metrics.partialSkillsCount}</p>
                <p className="text-[9px] text-amber-300/80 font-medium">Preliminary evidence</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-500/[0.03] border border-slate-500/20 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold">CLAIMED-ONLY</span>
                <p className="text-lg font-bold text-slate-300">{assessment.metrics.claimedOnlySkillsCount}</p>
                <p className="text-[9px] text-slate-400 font-medium">Unseen in public repos</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-muted-foreground font-semibold">Inspected Repos</span>
                <p className="text-lg font-bold text-violet-300">{assessment.metrics.totalInspectedRepos}</p>
                <p className="text-[9px] text-violet-300/80 font-medium">Public repositories</p>
              </div>
            </div>
          </div>

          {/* Critical Disclaimer Notice */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-200/90 leading-relaxed">
              {assessment.notice}
            </p>
          </div>

          {/* Role Insights & Evidence Expansion Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6 space-y-4 border-white/5 bg-white/[0.01]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Observed Evidence Strengths
              </h3>
              <ul className="space-y-2">
                {assessment.roleInsights.observedStrengths.map((strength, i) => (
                  <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
                {assessment.roleInsights.observedStrengths.length === 0 && (
                  <li className="text-xs text-muted-foreground">
                    Connect more public repositories to highlight coding strengths.
                  </li>
                )}
              </ul>
            </GlassCard>

            <GlassCard className="p-6 space-y-4 border-white/5 bg-white/[0.01]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                High-Value Evidence Next Steps
              </h3>
              <ul className="space-y-2">
                {assessment.roleInsights.evidenceOpportunities.map((opp, i) => (
                  <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>

          {/* ── Skills & Evidence Explorer ── */}
          <GlassCard className="p-6 space-y-6 border-white/5 bg-white/[0.01]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  Skill Classification Directory
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Click any skill to view deterministic classification reasoning, actionable next steps, and verifiable code artifacts.
                </p>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-indigo-500/50 text-xs text-white placeholder-muted-foreground/50 transition-all outline-none"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap border-b border-white/5 pb-4">
              {[
                { id: "all", label: "All", count: filterCounts.all },
                { id: "proven", label: "PROVEN", count: filterCounts.proven },
                { id: "partial", label: "PARTIAL", count: filterCounts.partial },
                { id: "claimed-only", label: "CLAIMED-ONLY", count: filterCounts.claimedOnly },
                { id: "role-core", label: "Role Core", count: filterCounts.roleCore },
              ].map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id as any)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 select-none ${
                      isActive
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10"
                        : "bg-white/[0.02] text-muted-foreground hover:text-white border border-white/5 hover:border-white/10"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                        isActive
                          ? "bg-indigo-500/40 text-indigo-100"
                          : "bg-white/5 text-muted-foreground"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSkills.map((item) => {
                const isExpanded = expandedSkill === item.skill;

                return (
                  <div
                    key={item.skill}
                    className={`rounded-xl border transition-all ${
                      item.classification === "PROVEN"
                        ? "bg-emerald-500/[0.01] border-emerald-500/20 hover:border-emerald-500/40"
                        : item.classification === "PARTIAL"
                        ? "bg-amber-500/[0.01] border-amber-500/20 hover:border-amber-500/40"
                        : "bg-white/[0.01] border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div
                      onClick={() => setExpandedSkill(isExpanded ? null : item.skill)}
                      className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">{item.skill}</span>
                          {getClassificationBadge(item.classification)}
                          {getRoleRelevanceBadge(item.roleRelevance, item.isRoleRelevant)}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {item.explanation}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground">
                          {item.evidenceCount} citation{item.evidenceCount === 1 ? "" : "s"}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Expandable Citations & Next Steps */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3 overflow-hidden"
                        >
                          {/* Classification Breakdown & Reasoning */}
                          <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1.5">
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block">
                              Evidence Decision Analysis:
                            </span>
                            <p className="text-xs text-gray-300">{item.explanation}</p>
                          </div>

                          {/* Actionable Next Step Recommendation */}
                          {item.nextStep && (
                            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                              <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-bold">
                                <Lightbulb className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span>Recommended Next Step</span>
                              </div>
                              <p className="text-xs text-indigo-200/90">{item.nextStep}</p>
                            </div>
                          )}

                          {/* Inspectable Citations */}
                          {item.citations.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                Verified Code Citations ({item.citations.length}):
                              </span>
                              {item.citations.map((cit, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-lg bg-black/20 border border-white/5 space-y-1"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-200 min-w-0">
                                      {getCitationIcon(cit.type)}
                                      <span className="truncate">{cit.title}</span>
                                    </div>
                                    <a
                                      href={cit.fileUrl || cit.repoUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20"
                                    >
                                      Inspect <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">{cit.description}</p>
                                  {cit.filePath && (
                                    <p className="text-[9px] font-mono text-gray-400 truncate">
                                      {cit.repoName} &rsaquo; {cit.filePath}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {filteredSkills.length === 0 && (
                <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
                  No skills match the selected filter.
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}
