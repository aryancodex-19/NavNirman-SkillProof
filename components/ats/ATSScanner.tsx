"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Activity, ShieldAlert, Sparkles, RefreshCw, FileText, CheckCircle, Upload } from "lucide-react";
import ScoreCard from "./ScoreCard";
import KeywordList from "./KeywordList";
import FeedbackList from "./FeedbackList";

interface ScanResponse {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  feedback: string[];
  formattingIssues: string[];
}

interface ATSScannerProps {
  dbResumeText?: string;
  dbResumeTitle?: string;
  dbHasResume?: boolean;
}

export default function ATSScanner({
  dbResumeText = "",
  dbResumeTitle = "",
  dbHasResume = false,
}: ATSScannerProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState(dbResumeText);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);

  // Auto-fill state
  const [resumeSource, setResumeSource] = useState<"saved" | "manual">(dbHasResume ? "saved" : "manual");
  const [hasSavedResume, setHasSavedResume] = useState(dbHasResume);
  const [savedResumeText, setSavedResumeText] = useState(dbResumeText);
  const [, setSavedResumeTitle] = useState(dbResumeTitle);
  const [loadingLatest, setLoadingLatest] = useState(false);

  React.useEffect(() => {
    // 1. First check if we have a resume text coming directly from builder via localStorage
    const cached = localStorage.getItem("ats_resume_text");
    if (cached) {
      setResumeText(cached);
      setResumeSource("manual");
      localStorage.removeItem("ats_resume_text");
      toast.success("Resume text loaded from builder!");
      return;
    }

    // 2. Otherwise use server-rendered data or fetch if none
    if (dbHasResume && dbResumeText) {
      setHasSavedResume(true);
      setSavedResumeText(dbResumeText);
      setSavedResumeTitle(dbResumeTitle || "Latest Resume");
      setResumeText(dbResumeText);
      setResumeSource("saved");
    } else {
      const fetchLatestResume = async () => {
        setLoadingLatest(true);
        try {
          const res = await fetch("/api/resume/latest-text");
          if (res.ok) {
            const data = await res.json();
            if (data.hasResume && data.resumeText) {
              setHasSavedResume(true);
              setSavedResumeText(data.resumeText);
              setSavedResumeTitle(data.resumeTitle || "Latest Resume");
              setResumeText(data.resumeText);
              setResumeSource("saved");
              toast.success("Resume auto-filled from your saved resume!");
            }
          }
        } catch (err) {
          console.error("Error fetching latest resume:", err);
        } finally {
          setLoadingLatest(false);
        }
      };

      fetchLatestResume();
    }
  }, [dbHasResume, dbResumeText, dbResumeTitle]);

  const handleModeChange = (source: "saved" | "manual") => {
    if (source === "saved") {
      if (!hasSavedResume) {
        toast.error("No saved resume found", {
          description: "Please upload your resume in the Resume Builder first.",
        });
        return;
      }
      setResumeText(savedResumeText);
      setResumeSource("saved");
    } else {
      setResumeSource("manual");
      if (resumeText === savedResumeText) {
        setResumeText("");
      }
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobDescription.trim()) {
      toast.error("Missing Job Description", {
        description: "Please enter the target job description to match against.",
      });
      return;
    }

    if (!resumeText.trim()) {
      toast.error("Missing Resume Content", {
        description: "Please paste your resume plain text or use a saved resume.",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/ats/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobDescription,
          resumeText,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to scan resume. Check network logs.");
      }

      const data: ScanResponse = await res.json();
      setResult(data);
      toast.success("ATS scan completed successfully!", {
        description: `Match score calculated: ${data.score}%`,
      });
    } catch (err: any) {
      console.error("Scan error:", err);
      toast.error("Scan Failed", {
        description: err.message || "An unexpected error occurred while communicating with the AI API.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setJobDescription("");
    if (resumeSource === "saved" && hasSavedResume) {
      setResumeText(savedResumeText);
    } else {
      setResumeText("");
    }
    setResult(null);
    toast.info("Inputs cleared");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
      {/* Input panel (Left - 5 Cols on desktop) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_32px_rgba(139,92,246,0.12)] flex-1">
          <CardHeader className="border-b border-white/10 pb-4">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>ATS Scan Configuration</span>
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              Provide the job description and your resume text. AI matches alignment instantly.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Mode selection buttons */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => handleModeChange("saved")}
                disabled={loadingLatest}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  resumeSource === "saved"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Use Saved Resume</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("manual")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  resumeSource === "manual"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Paste Manually</span>
              </button>
            </div>

            <form onSubmit={handleScan} className="space-y-6">
              {/* Job Description Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-gray-300 uppercase tracking-wider">
                  Target Job Description
                </label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target job description (responsibilities, skills, requirements) here..."
                  className="min-h-[160px] resize-none leading-relaxed text-xs"
                  disabled={loading}
                />
              </div>

              {/* Resume Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-gray-300 uppercase tracking-wider">
                    Resume Text (Plain Text)
                  </label>

                  {/* Save Status / Upload trigger link */}
                  {!hasSavedResume && !loadingLatest && (
                    <a
                      href="/dashboard/resume"
                      className="text-[11px] text-purple-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload Resume</span>
                    </a>
                  )}
                </div>

                {/* Auto-filled Badge */}
                {resumeSource === "saved" && hasSavedResume && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-lg text-[11px] font-semibold animate-fade-in shadow-[0_0_12px_rgba(168,85,247,0.15)]">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                    <span>Resume auto-filled from your profile</span>
                  </div>
                )}

                <Textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste the text content of your resume here..."
                  className="min-h-[220px] resize-none leading-relaxed text-xs"
                  disabled={loading}
                />
              </div>

              {/* Controls */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading || (!jobDescription && !resumeText)}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 shrink-0" />
                  <span>Clear</span>
                </Button>

                <Button type="submit" variant="gradient" loading={loading} className="flex-[2]">
                  {!loading && <Activity className="w-4 h-4 shrink-0" />}
                  <span>{loading ? "Analyzing..." : "Analyze Alignment"}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Results panel (Right - 7 Cols on desktop) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {loading ? (
          // Loading skeleton state
          <Card className="border border-dashed border-purple-500/30 bg-purple-950/10 backdrop-blur-xl flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[450px]">
            <div className="space-y-6 w-full max-w-sm flex flex-col items-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-t-purple-500 border-white/10 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-400 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">AI Scanner Active</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Extracting key skills, evaluating structural formatting, and calculating match compatibility scores...
                </p>
              </div>
            </div>
          </Card>
        ) : result ? (
          // Analysis Results
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <ScoreCard score={result.score} />
            </div>
            <KeywordList
              matchedKeywords={result.matchedKeywords}
              missingKeywords={result.missingKeywords}
            />
            <FeedbackList feedback={result.feedback} formattingIssues={result.formattingIssues} />
          </div>
        ) : (
          // Empty State
          <Card className="border border-dashed border-white/15 bg-white/[0.02] backdrop-blur-xl flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[450px]">
            <div className="space-y-4 max-w-sm flex flex-col items-center">
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">Scan Results Awaiting</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Enter target specifications and paste your resume inside the form, then click <span className="text-purple-400 font-semibold">Analyze Alignment</span> to run the scan.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
