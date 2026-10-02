"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { SkillProofAnalysis } from "@/types/skillproof";
import { Briefcase, ExternalLink, FileText, GitBranch, Loader2, ShieldCheck, UploadCloud } from "lucide-react";

interface SkillProofDashboardProps {
  candidateName: string;
  defaultGithubUsername: string;
}

const verdictStyles: Record<string, string> = {
  PROVEN: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  PARTIAL: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  CLAIMED_ONLY: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
};

const strengthStyles: Record<string, string> = {
  STRONG: "text-emerald-300",
  PARTIAL: "text-amber-300",
  WEAK: "text-rose-300",
};

export default function SkillProofDashboard({
  candidateName,
  defaultGithubUsername,
}: SkillProofDashboardProps) {
  const [resumeText, setResumeText] = useState("");
  const [resumeName, setResumeName] = useState("Resume PDF");
  const [githubUsername, setGithubUsername] = useState(defaultGithubUsername);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SkillProofAnalysis | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string>("");

  const selectedSkillRecord = useMemo(() => {
    if (!result?.skills?.length) return null;
    return result.skills.find((item) => item.skill === selectedSkill) || result.skills[0];
  }, [result, selectedSkill]);

  async function handleResumeUpload(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF resume.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to parse resume.");
      }

      const transcript = [
        data.fullName ? `Name: ${data.fullName}` : "",
        data.summary ? `Summary: ${data.summary}` : "",
        data.skills?.length ? `Skills: ${data.skills.join(", ")}` : "",
        ...(Array.isArray(data.experience) ? data.experience.map((exp: any) => `${exp.role || "Role"} at ${exp.company || "Company"}: ${(exp.bullets || []).join(" ")}`) : []),
      ]
        .filter(Boolean)
        .join("\n\n");

      setResumeText(transcript);
      setResumeName(file.name);
      toast.success("Resume parsed successfully.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Unable to parse resume.");
    }
  }

  async function handleAnalyze() {
    if (!resumeText.trim()) {
      toast.error("Please upload or paste a resume before analyzing.");
      return;
    }

    if (!githubUsername.trim()) {
      toast.error("Please enter a GitHub username.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/skillproof/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          githubUsername,
          jobDescription,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "SkillProof analysis failed.");
      }

      setResult(data);
      setSelectedSkill(data.skills?.[0]?.skill || "");
      toast.success("SkillProof analysis complete.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Skill verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Candidate</p>
                <h2 className="mt-2 text-xl font-bold text-white">{candidateName}</h2>
              </div>
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-200">
                {resumeName}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Resume PDF</label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-4 py-6 text-sm font-semibold text-slate-200 transition hover:border-indigo-400 hover:bg-slate-900">
                  <UploadCloud className="h-4 w-4 text-indigo-300" />
                  <span>Upload resume</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleResumeUpload(file);
                    }}
                  />
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">GitHub username</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-3">
                  <GitBranch className="h-4 w-4 text-slate-400" />
                  <input
                    value={githubUsername}
                    onChange={(event) => setGithubUsername(event.target.value)}
                    placeholder="e.g. aryancodex-19"
                    className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Optional job description</label>
                <textarea
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  rows={8}
                  placeholder="Paste the job description to compare required skills against actual evidence."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-sm text-white placeholder:text-slate-500 outline-none resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {loading ? "Analyzing evidence..." : "Verify skills"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 backdrop-blur">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
              <FileText className="h-4 w-4 text-indigo-300" />
              Resume summary
            </div>
            <textarea
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              rows={12}
              placeholder="Paste or upload a resume to extract claimed skills."
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-sm text-white placeholder:text-slate-500 outline-none resize-none"
            />
          </div>
        </div>

        <div className="xl:col-span-7 space-y-6">
          {!result ? (
            <div className="flex min-h-[560px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
              <div className="max-w-md space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-300">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-white">Skill verification is ready</h3>
                <p className="text-sm text-slate-300">
                  Upload a resume, add a GitHub username, and compare real public evidence against claimed skills before any recruiter sees the profile.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Overall evidence coverage</p>
                  <div className="mt-4 text-3xl font-black text-white">{result.overallCoverage}%</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Claimed skills</p>
                  <div className="mt-4 text-3xl font-black text-white">{result.claimedSkills.length}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">GitHub profile</p>
                  <div className="mt-3 text-sm font-semibold text-indigo-200">
                    <a href={result.githubProfile.htmlUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
                      @{result.githubProfile.login}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
                  <ShieldCheck className="h-4 w-4 text-indigo-300" />
                  Verified skills
                </div>
                <div className="grid gap-3">
                  {result.skills.map((skill) => (
                    <button
                      key={skill.skill}
                      type="button"
                      onClick={() => setSelectedSkill(skill.skill)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selectedSkillRecord?.skill === skill.skill
                          ? "border-indigo-500/40 bg-indigo-500/10"
                          : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-lg font-bold text-white">{skill.skill}</div>
                          <div className="mt-1 text-xs text-slate-400">Resume claim • {skill.repositoryCount} repo match{skill.repositoryCount === 1 ? "" : "es"}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${verdictStyles[skill.verdict]}`}>
                            {skill.verdict}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${strengthStyles[skill.evidenceStrength]}`}>
                            {skill.evidenceStrength}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedSkillRecord && (
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Evidence trail</p>
                      <h3 className="mt-2 text-2xl font-black text-white">{selectedSkillRecord.skill}</h3>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${verdictStyles[selectedSkillRecord.verdict]}`}>
                      {selectedSkillRecord.verdict}
                    </span>
                  </div>

                  <div className="space-y-4 text-sm text-slate-200">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Resume claim</div>
                      <div className="mt-2 text-slate-100">{selectedSkillRecord.claimedLevel || "Resume claim"}</div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Evidence found</div>
                      <ul className="mt-2 space-y-2 text-slate-200">
                        {selectedSkillRecord.evidenceSummary.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">What it supports</div>
                      <p className="mt-2 text-slate-200">{selectedSkillRecord.whatItSupports}</p>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">What it does not prove</div>
                      <p className="mt-2 text-slate-200">{selectedSkillRecord.whatItDoesNotProve}</p>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Evidence links</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedSkillRecord.evidenceLinks.map((link) => (
                          <a
                            key={`${link.label}-${link.url}`}
                            href={link.url === "#" ? undefined : link.url}
                            target={link.url === "#" ? undefined : "_blank"}
                            rel={link.url === "#" ? undefined : "noreferrer"}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:border-indigo-500/40"
                          >
                            {link.label}
                            {link.url !== "#" && <ExternalLink className="h-3 w-3" />}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {result.jobReport && (
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
                    <Briefcase className="h-4 w-4 text-indigo-300" />
                    Job readiness gap report
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Overall match</p>
                      <div className="mt-3 text-3xl font-black text-white">{result.jobReport.matchScore}%</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Supported skills</p>
                      <div className="mt-3 text-2xl font-black text-emerald-300">{result.jobReport.supportedSkills.length}</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Missing</p>
                      <div className="mt-3 text-2xl font-black text-rose-300">{result.jobReport.missingRequirements.length}</div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                      <h4 className="text-sm font-bold text-white">Supported skills</h4>
                      <ul className="mt-3 space-y-2 text-sm text-slate-200">
                        {result.jobReport.supportedSkills.length > 0 ? result.jobReport.supportedSkills.map((skill) => (
                          <li key={skill} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /> {skill}</li>
                        )) : <li className="text-slate-400">No job skills were supported yet.</li>}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                      <h4 className="text-sm font-bold text-white">Insufficient evidence</h4>
                      <ul className="mt-3 space-y-2 text-sm text-slate-200">
                        {result.jobReport.insufficientEvidence.length > 0 ? result.jobReport.insufficientEvidence.map((skill) => (
                          <li key={skill} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400" /> {skill}</li>
                        )) : <li className="text-slate-400">No gaps detected in observed evidence.</li>}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    <h4 className="text-sm font-bold text-white">Missing requirements</h4>
                    <ul className="mt-3 space-y-2 text-sm text-slate-200">
                      {result.jobReport.missingRequirements.length > 0 ? result.jobReport.missingRequirements.map((skill) => (
                        <li key={skill} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose-400" /> {skill}</li>
                      )) : <li className="text-slate-400">Everything required by the job description has at least partial evidence.</li>}
                    </ul>
                  </div>

                  {result.jobReport.skillGaps.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <h4 className="text-sm font-bold text-white">Micro-tasks for skill gaps</h4>
                      {result.jobReport.skillGaps.map((gap) => (
                        <div key={gap.skill} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Skill gap</p>
                              <h5 className="mt-1 text-lg font-bold text-white">{gap.skill}</h5>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${verdictStyles[gap.verdict]}`}>
                              {gap.verdict}
                            </span>
                          </div>

                          <div className="mt-4 space-y-2 text-sm text-slate-200">
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Micro-task</div>
                              <p className="mt-2 text-slate-100">{gap.microtask}</p>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Estimated time</div>
                              <p className="mt-2 text-slate-100">{gap.estimatedTime}</p>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Expected evidence</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {gap.expectedEvidence.map((item) => (
                                  <span key={item} className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] font-semibold text-slate-200">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
