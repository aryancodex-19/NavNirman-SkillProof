"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Save,
  Trash2,
  Plus,
  ArrowLeft,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Wrench,
  User,
  Activity,
  FileText,
  Loader2,
  Trash,
} from "lucide-react";
import FileUpload from "../ui/FileUpload";
import ResumePreview from "./ResumePreview";
import { type ResumeData, type Experience, type Education, type ATSResult } from "@/types";

interface SavedResume {
  id: string;
  title: string;
  updatedAt: string;
  fullName: string | null;
  targetRole: string | null;
  atsScore: number | null;
}

export default function ResumeBuilder() {
  // Navigation & list view
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Resume active data
  const [title, setTitle] = useState("My Resume");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [targetRole, setTargetRole] = useState("");
  const [atsScore, setAtsScore] = useState<number | null>(null);

  // Page states
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"details" | "experience" | "education" | "skills" | "ats">("details");
  const [mobileMode, setMobileMode] = useState<"edit" | "preview">("edit");

  // AI loading states
  const [rewritingSummary, setRewritingSummary] = useState(false);
  const [rewritingBulletIdx, setRewritingBulletIdx] = useState<{ expIdx: number; bulletIdx: number } | null>(null);
  const [rewritingAllExp, setRewritingAllExp] = useState(false);

  // ATS scanner state
  const [jobDescription, setJobDescription] = useState("");
  const [scanningATS, setScanningATS] = useState(false);
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);

  // Skill input helper
  const [skillInput, setSkillInput] = useState("");

  // Fetch list of saved resumes
  const fetchResumes = async () => {
    try {
      setLoadingList(true);
      const res = await fetch("/api/resume/save", { method: "GET" }).catch(() => null);
      if (res && res.ok) {
        // Wait, does the save route support GET? Let's check.
        // Wait! We didn't define a GET handler in /api/resume/save. Let's create an API route for listing if needed, or query them inside a Server Component in app/dashboard/resume/page.tsx and pass them.
        // Let's implement the GET fetch inside /api/resume/save/route.ts later, or list from a new action.
        // For simplicity, we can fetch from a GET request to `/api/resume/save` or implement it. Let's check what routes are available.
        // Let's implement list/GET inside `/api/resume/save/route.ts`! That is a very clean API choice. Let's make sure it handles GET.
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  // We can fetch user resumes on mount
  useEffect(() => {
    // Fetch list of resumes
    const loadList = async () => {
      try {
        const res = await fetch("/api/resume/save");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setResumes(data);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingList(false);
      }
    };
    loadList();
  }, []);

  // Sync state helpers
  const getResumeData = (): ResumeData => ({
    fullName,
    email,
    phone,
    summary,
    skills,
    experience,
    education,
  });

  const loadResumeIntoState = (resData: any) => {
    setCurrentId(resData.id || null);
    setTitle(resData.title || "My Resume");
    setFullName(resData.fullName || "");
    setEmail(resData.email || "");
    setPhone(resData.phone || "");
    setSummary(resData.summary || "");
    setTargetRole(resData.targetRole || "");
    setAtsScore(resData.atsScore || null);

    // Handle parsed JSON fields from SQLite
    try {
      setSkills(typeof resData.skills === "string" ? JSON.parse(resData.skills) : resData.skills || []);
    } catch (e) {
      setSkills([]);
    }

    try {
      setExperience(typeof resData.experience === "string" ? JSON.parse(resData.experience) : resData.experience || []);
    } catch (e) {
      setExperience([]);
    }

    try {
      setEducation(typeof resData.education === "string" ? JSON.parse(resData.education) : resData.education || []);
    } catch (e) {
      setEducation([]);
    }

    setIsEditing(true);
  };

  // Drag-and-drop file upload parser
  const handleFileSelect = async (file: File) => {
    setUploading(true);
    setUploadProgress(10);

    // Mock progress ticker
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 400);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to parse PDF resume");
      }

      const parsedData = await res.json();

      // Load parsed data into state
      setFullName(parsedData.fullName || "");
      setEmail(parsedData.email || "");
      setPhone(parsedData.phone || "");
      setSummary(parsedData.summary || "");
      setSkills(parsedData.skills || []);
      setExperience(parsedData.experience || []);
      setEducation(parsedData.education || []);
      if (parsedData.id) {
        setCurrentId(parsedData.id);
        toast.success("Resume parsed and saved to database!");
      } else {
        toast.success("Resume parsed successfully!");
      }
      setIsEditing(true);
    } catch (error: any) {
      clearInterval(progressInterval);
      toast.error(error.message || "An error occurred during resume parsing.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Start with a blank template
  const handleStartBlank = () => {
    setCurrentId(null);
    setTitle("My Resume");
    setFullName("");
    setEmail("");
    setPhone("");
    setSummary("");
    setSkills([]);
    setExperience([]);
    setEducation([]);
    setTargetRole("");
    setAtsScore(null);
    setAtsResult(null);
    setIsEditing(true);
  };

  // Save resume state to database
  const handleSave = async () => {
    const savePromise = new Promise(async (resolve, reject) => {
      try {
        const payload = {
          id: currentId,
          title,
          fullName,
          email,
          phone,
          summary,
          skills,
          experience,
          education,
          atsScore,
          targetRole,
        };

        const res = await fetch("/api/resume/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to save");
        }

        const data = await res.json();
        setCurrentId(data.id);

        // Update list
        const listRes = await fetch("/api/resume/save");
        if (listRes.ok) {
          const listData = await listRes.json();
          if (Array.isArray(listData)) setResumes(listData);
        }

        resolve(data);
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(savePromise, {
      loading: "Saving your resume...",
      success: "Resume saved successfully!",
      error: "Could not save resume.",
    });
  };

  const handleSendToATS = () => {
    const plainTextResume = `
${fullName}
${email} | ${phone}
${targetRole || ""}

SUMMARY
${summary}

SKILLS
${skills.join(", ")}

EXPERIENCE
${experience.map(exp => `
${exp.role} at ${exp.company} (${exp.duration})
${exp.bullets.map(b => `- ${b}`).join("\n")}
`).join("\n")}

EDUCATION
${education.map(edu => `
${edu.degree} from ${edu.school} (${edu.year}) ${edu.gpa ? `GPA: ${edu.gpa}` : ""}
`).join("\n")}
`.trim();

    localStorage.setItem("ats_resume_text", plainTextResume);
    toast.success("Resume text sent to ATS Scanner!");
    window.location.href = "/dashboard/ats";
  };

  const handleSendToPortfolio = () => {
    const resumeData = {
      fullName,
      email,
      summary,
      skills: JSON.stringify(skills),
      experience: JSON.stringify(experience),
      education: JSON.stringify(education),
      targetRole,
    };
    localStorage.setItem("portfolio_resume_data", JSON.stringify(resumeData));
    toast.success("Resume data sent to Portfolio Generator!");
    window.location.href = "/dashboard/portfolio";
  };

  // Delete resume from database
  const handleDeleteResume = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this resume?")) return;

    try {
      const res = await fetch("/api/resume/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        toast.success("Resume deleted");
        setResumes((prev) => prev.filter((r) => r.id !== id));
        if (currentId === id) {
          setIsEditing(false);
          handleStartBlank();
        }
      } else {
        toast.error("Failed to delete resume");
      }
    } catch (err) {
      toast.error("Error deleting resume");
    }
  };

  // Load a saved resume from the list
  const handleSelectResume = async (resume: SavedResume) => {
    try {
      const res = await fetch(`/api/resume/save?id=${resume.id}`);
      if (res.ok) {
        const fullResume = await res.json();
        loadResumeIntoState(fullResume);
      } else {
        // If query param fetch isn't supported, fetch full object from local list or handle it
        toast.error("Failed to load resume");
      }
    } catch (err) {
      toast.error("Error loading resume");
    }
  };

  // AI helper: Rewrite Professional Summary
  const handleAIRewriteSummary = async () => {
    if (!targetRole) {
      toast.warning("Please specify a target role first!");
      setActiveTab("details");
      return;
    }

    setRewritingSummary(true);
    try {
      const res = await fetch("/api/resume/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "summary",
          summary,
          targetRole,
        }),
      });

      if (!res.ok) throw new Error("AI rewrite failed");
      const data = await res.json();
      setSummary(data.summary);
      toast.success("Summary optimized for " + targetRole);
    } catch (err) {
      toast.error("Failed to optimize summary");
    } finally {
      setRewritingSummary(false);
    }
  };

  // AI helper: Rewrite single work experience bullet point
  const handleAIRewriteBullet = async (expIdx: number, bulletIdx: number, bulletText: string) => {
    if (!targetRole) {
      toast.warning("Please specify a target role first!");
      return;
    }

    setRewritingBulletIdx({ expIdx, bulletIdx });
    try {
      const res = await fetch("/api/resume/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "bullet",
          bullet: bulletText,
          targetRole,
        }),
      });

      if (!res.ok) throw new Error("AI rewrite failed");
      const data = await res.json();

      const updatedExp = [...experience];
      updatedExp[expIdx].bullets[bulletIdx] = data.bullet;
      setExperience(updatedExp);
      toast.success("Bullet point optimized!");
    } catch (err) {
      toast.error("Failed to optimize bullet point");
    } finally {
      setRewritingBulletIdx(null);
    }
  };

  // AI helper: Rewrite all work experiences at once
  const handleAIRewriteAllExperience = async () => {
    if (!targetRole) {
      toast.warning("Please specify a target role first!");
      return;
    }

    setRewritingAllExp(true);
    try {
      const res = await fetch("/api/resume/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "resume",
          resumeData: { experience },
          targetRole,
        }),
      });

      if (!res.ok) throw new Error("AI rewrite failed");
      const data = await res.json();

      if (data.experience) {
        setExperience(data.experience);
        toast.success("All experience entry bullet points rewritten!");
      }
    } catch (err) {
      toast.error("Failed to optimize experience section");
    } finally {
      setRewritingAllExp(false);
    }
  };

  // ATS Scanner: matches current resume against job description
  const handleScanATS = async () => {
    if (!jobDescription.trim()) {
      toast.warning("Please paste a job description first!");
      return;
    }

    setScanningATS(true);
    try {
      const res = await fetch("/api/resume/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData: getResumeData(),
          jobDescription,
        }),
      });

      if (!res.ok) throw new Error("ATS scan failed");
      const data = await res.json();
      setAtsResult(data);
      setAtsScore(data.score);
      toast.success("ATS scan complete! Score: " + data.score + "%");
    } catch (err) {
      toast.error("Failed to run ATS scanner");
    } finally {
      setScanningATS(false);
    }
  };

  // Skills handlers
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillInput.trim()) return;

    if (skills.includes(skillInput.trim())) {
      toast.warning("Skill already added!");
      return;
    }

    setSkills((prev) => [...prev, skillInput.trim()]);
    setSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // Experience Handlers
  const handleAddExperience = () => {
    setExperience((prev) => [
      ...prev,
      { company: "", role: "", duration: "", bullets: [""] },
    ]);
  };

  const handleUpdateExperience = (idx: number, field: keyof Experience, value: any) => {
    const updated = [...experience];
    updated[idx] = { ...updated[idx], [field]: value };
    setExperience(updated);
  };

  const handleAddBullet = (expIdx: number) => {
    const updated = [...experience];
    updated[expIdx].bullets.push("");
    setExperience(updated);
  };

  const handleUpdateBullet = (expIdx: number, bulletIdx: number, value: string) => {
    const updated = [...experience];
    updated[expIdx].bullets[bulletIdx] = value;
    setExperience(updated);
  };

  const handleRemoveBullet = (expIdx: number, bulletIdx: number) => {
    const updated = [...experience];
    updated[expIdx].bullets.splice(bulletIdx, 1);
    setExperience(updated);
  };

  const handleRemoveExperience = (idx: number) => {
    setExperience((prev) => prev.filter((_, i) => i !== idx));
  };

  // Education Handlers
  const handleAddEducation = () => {
    setEducation((prev) => [...prev, { school: "", degree: "", year: "", gpa: "" }]);
  };

  const handleUpdateEducation = (idx: number, field: keyof Education, value: string) => {
    const updated = [...education];
    updated[idx] = { ...updated[idx], [field]: value };
    setEducation(updated);
  };

  const handleRemoveEducation = (idx: number) => {
    setEducation((prev) => prev.filter((_, i) => i !== idx));
  };

  // Back button from builder to main menu
  const handleBackToMenu = () => {
    setIsEditing(false);
  };

  // Helper colors for ATS score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5";
    if (score >= 50) return "text-amber-500 border-amber-500/20 bg-amber-500/5";
    return "text-destructive border-destructive/20 bg-destructive/5";
  };

  // Render initial dashboard upload/select view
  if (!isEditing) {
    return (
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto py-4">
        {/* Title */}
        <div className="flex flex-col gap-2 text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            AI Resume Builder
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Upload an existing resume PDF to let Gemini auto-parse it into structured fields, or start fresh using a premium optimized template.
          </p>
        </div>

        {/* Upload Container */}
        <div className="glass-card p-6 md:p-8 rounded-2xl border border-border shadow-xl space-y-6">
          <FileUpload
            onFileSelect={handleFileSelect}
            loading={uploading}
            progress={uploadProgress}
          />

          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] bg-border flex-1" />
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">or</span>
            <div className="h-[1px] bg-border flex-1" />
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleStartBlank}
              className="flex items-center gap-2 px-6 py-3 border border-border bg-card hover:bg-card-hover text-foreground font-semibold rounded-xl transition-all duration-300 shadow-md hover:scale-[1.01]"
            >
              <Plus className="w-5 h-5 text-primary" />
              <span>Create from Scratch</span>
            </button>
          </div>
        </div>

        {/* Saved Resumes List */}
        <div className="space-y-4">
          <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>Saved Resumes</span>
          </h3>

          {loadingList ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Loading saved resumes...</span>
            </div>
          ) : resumes.length === 0 ? (
            <p className="text-sm text-muted-foreground italic bg-muted/20 p-4 rounded-xl border border-border/50">
              No saved resumes found. Start by uploading one or creating a blank resume!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  onClick={() => handleSelectResume(resume)}
                  className="group flex items-center justify-between p-4 bg-card border border-border hover:border-primary/50 hover:bg-card-hover rounded-xl cursor-pointer shadow-sm transition-all duration-300 hover:scale-[1.01]"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                      {resume.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Last edited: {new Date(resume.updatedAt).toLocaleDateString()}
                    </p>
                    {resume.fullName && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                        Owner: {resume.fullName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {resume.atsScore !== null && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${getScoreColor(resume.atsScore)}`}>
                        {resume.atsScore}% Match
                      </span>
                    )}
                    <button
                      onClick={(e) => handleDeleteResume(resume.id, e)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                      title="Delete Resume"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render builder workspace interface (split-screen)
  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
      {/* Top action bar */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToMenu}
            className="p-2 border border-border bg-card hover:bg-card-hover text-muted-foreground hover:text-foreground rounded-xl transition-all shadow-sm"
            title="Back to Resumes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none text-foreground py-0.5 px-1 max-w-[200px] sm:max-w-xs transition-colors"
              title="Click to rename resume title"
            />
            <p className="text-xs text-muted-foreground">Workspace editor</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Mobile view toggler */}
          <div className="lg:hidden flex border border-border bg-card p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setMobileMode("edit")}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                mobileMode === "edit" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Edit Form
            </button>
            <button
              onClick={() => setMobileMode("preview")}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                mobileMode === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              PDF Preview
            </button>
          </div>

          <button
            onClick={handleSendToATS}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border bg-card hover:bg-card-hover text-foreground font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] shrink-0 w-full sm:w-auto text-xs"
          >
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span>Send to ATS</span>
          </button>

          <button
            onClick={handleSendToPortfolio}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border bg-card hover:bg-card-hover text-foreground font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] shrink-0 w-full sm:w-auto text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Send to Portfolio</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary-hover hover:to-purple-700 text-white font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] shrink-0 w-full sm:w-auto text-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Main split grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-[600px]">
        {/* Left pane: Editable fields (hidden on mobile when preview tab is selected) */}
        <div
          className={`lg:col-span-6 flex flex-col gap-6 no-print ${
            mobileMode === "preview" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Tabs */}
          <div className="flex border-b border-border overflow-x-auto gap-2 scrollbar-none">
            {[
              { id: "details", label: "Details", icon: User },
              { id: "skills", label: "Skills", icon: Wrench },
              { id: "experience", label: "Experience", icon: Briefcase },
              { id: "education", label: "Education", icon: GraduationCap },
              { id: "ats", label: "ATS Scanner", icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "border-primary text-primary font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 space-y-6">
            {/* Details Panel */}
            {activeTab === "details" && (
              <div className="glass-card p-6 border border-border rounded-2xl space-y-4">
                <h3 className="font-bold text-foreground text-base border-b border-border pb-2">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-card-hover focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-foreground text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Target Role
                    </label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="Frontend Developer"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-card-hover focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-foreground text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane.doe@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-card-hover focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-foreground text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-card-hover focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-foreground text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Professional Summary
                    </label>
                    <button
                      onClick={handleAIRewriteSummary}
                      disabled={rewritingSummary}
                      className="flex items-center gap-1 text-xs text-primary font-bold hover:text-primary-hover disabled:opacity-50"
                    >
                      {rewritingSummary ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>AI Rewrite</span>
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Brief overview of your experience, skills, and career focus..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card hover:bg-card-hover focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-foreground text-sm transition-all resize-none leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Skills Panel */}
            {activeTab === "skills" && (
              <div className="glass-card p-6 border border-border rounded-2xl space-y-4">
                <h3 className="font-bold text-foreground text-base border-b border-border pb-2">
                  Skills & Core Competencies
                </h3>

                <form onSubmit={handleAddSkill} className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Type a skill (e.g. JavaScript, AWS, Project Management) and press Enter"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-card-hover focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-foreground text-sm transition-all"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl shadow transition-all hover:scale-[1.01] text-sm"
                  >
                    Add
                  </button>
                </form>

                <div className="flex flex-wrap gap-2 pt-2">
                  {skills.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No skills added yet.</p>
                  ) : (
                    skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-secondary text-foreground text-xs font-semibold rounded-lg border border-border group"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Experience Panel */}
            {activeTab === "experience" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-base">Work Experience</h3>
                  <div className="flex items-center gap-2">
                    {experience.length > 0 && (
                      <button
                        onClick={handleAIRewriteAllExperience}
                        disabled={rewritingAllExp}
                        className="flex items-center gap-1 px-3 py-1.5 border border-primary/20 bg-primary/5 text-primary text-xs font-bold rounded-lg hover:bg-primary/10 disabled:opacity-50"
                      >
                        {rewritingAllExp ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>AI Rewrite All Bullets</span>
                      </button>
                    )}
                    <button
                      onClick={handleAddExperience}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-lg transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Work</span>
                    </button>
                  </div>
                </div>

                {experience.length === 0 ? (
                  <div className="glass-card p-6 border border-border rounded-2xl text-center">
                    <p className="text-sm text-muted-foreground italic">No work experience entries added.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {experience.map((exp, expIdx) => (
                      <div
                        key={expIdx}
                        className="glass-card p-6 border border-border rounded-2xl relative space-y-4 group/card"
                      >
                        <button
                          onClick={() => handleRemoveExperience(expIdx)}
                          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover/card:opacity-100 transition-all"
                          title="Remove Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                              Company
                            </label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => handleUpdateExperience(expIdx, "company", e.target.value)}
                              placeholder="Google"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:border-primary focus:outline-none text-foreground text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                              Role / Title
                            </label>
                            <input
                              type="text"
                              value={exp.role}
                              onChange={(e) => handleUpdateExperience(expIdx, "role", e.target.value)}
                              placeholder="Software Engineer"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:border-primary focus:outline-none text-foreground text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                              Dates / Duration
                            </label>
                            <input
                              type="text"
                              value={exp.duration}
                              onChange={(e) => handleUpdateExperience(expIdx, "duration", e.target.value)}
                              placeholder="June 2023 - Present"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:border-primary focus:outline-none text-foreground text-sm"
                            />
                          </div>
                        </div>

                        {/* Bullet points list */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                              Key Accomplishments & Responsibilities
                            </label>
                            <button
                              onClick={() => handleAddBullet(expIdx)}
                              className="flex items-center gap-1 text-[10px] text-primary font-bold hover:underline"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Bullet</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {exp.bullets.map((bullet, bulletIdx) => (
                              <div key={bulletIdx} className="flex gap-2 items-center group/bullet">
                                <input
                                  type="text"
                                  value={bullet}
                                  onChange={(e) => handleUpdateBullet(expIdx, bulletIdx, e.target.value)}
                                  placeholder="Spearheaded design and deployment of cloud infrastructure..."
                                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-card focus:border-primary focus:outline-none text-foreground text-xs"
                                />

                                {/* AI bullet rewrite */}
                                <button
                                  onClick={() => handleAIRewriteBullet(expIdx, bulletIdx, bullet)}
                                  disabled={
                                    rewritingBulletIdx?.expIdx === expIdx &&
                                    rewritingBulletIdx?.bulletIdx === bulletIdx
                                  }
                                  className="p-1.5 text-primary hover:bg-primary/10 rounded-lg disabled:opacity-50 shrink-0"
                                  title="AI Optimize Bullet"
                                >
                                  {rewritingBulletIdx?.expIdx === expIdx &&
                                  rewritingBulletIdx?.bulletIdx === bulletIdx ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <button
                                  onClick={() => handleRemoveBullet(expIdx, bulletIdx)}
                                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg group-hover/bullet:opacity-100 opacity-0 transition-opacity shrink-0"
                                  title="Delete Bullet"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Education Panel */}
            {activeTab === "education" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-base">Education History</h3>
                  <button
                    onClick={handleAddEducation}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add School</span>
                  </button>
                </div>

                {education.length === 0 ? (
                  <div className="glass-card p-6 border border-border rounded-2xl text-center">
                    <p className="text-sm text-muted-foreground italic">No education entries added.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {education.map((edu, idx) => (
                      <div
                        key={idx}
                        className="glass-card p-6 border border-border rounded-2xl relative space-y-4 group/card"
                      >
                        <button
                          onClick={() => handleRemoveEducation(idx)}
                          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover/card:opacity-100 transition-all"
                          title="Remove Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                              University / School
                            </label>
                            <input
                              type="text"
                              value={edu.school}
                              onChange={(e) => handleUpdateEducation(idx, "school", e.target.value)}
                              placeholder="Stanford University"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:border-primary focus:outline-none text-foreground text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                              Degree / Major
                            </label>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => handleUpdateEducation(idx, "degree", e.target.value)}
                              placeholder="B.S. in Computer Science"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:border-primary focus:outline-none text-foreground text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                              Graduation Year / Dates
                            </label>
                            <input
                              type="text"
                              value={edu.year}
                              onChange={(e) => handleUpdateEducation(idx, "year", e.target.value)}
                              placeholder="2026"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:border-primary focus:outline-none text-foreground text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                              GPA (Optional)
                            </label>
                            <input
                              type="text"
                              value={edu.gpa}
                              onChange={(e) => handleUpdateEducation(idx, "gpa", e.target.value)}
                              placeholder="3.8/4.0"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:border-primary focus:outline-none text-foreground text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ATS Scanner Panel */}
            {activeTab === "ats" && (
              <div className="glass-card p-6 border border-border rounded-2xl space-y-6">
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-foreground text-base">ATS Compatibility Scanner</h3>
                  <p className="text-xs text-muted-foreground">
                    Paste the target job description to match your skills, education, and bullet achievements.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Job Description
                  </label>
                  <textarea
                    rows={8}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste full job description from LinkedIn, Indeed, etc. here..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card hover:bg-card-hover focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-foreground text-sm transition-all resize-none leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleScanATS}
                  disabled={scanningATS}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl shadow transition-all hover:scale-[1.01] disabled:opacity-50"
                >
                  {scanningATS ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Activity className="w-4 h-4" />
                  )}
                  <span>Calculate ATS Score</span>
                </button>

                {atsResult && (
                  <div className="pt-6 border-t border-border space-y-6 animate-fade-in">
                    {/* Score Visual Block */}
                    <div className="flex items-center gap-6 p-4 bg-muted/30 rounded-2xl border border-border/50">
                      {/* Circular Gauge */}
                      <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-zinc-200 dark:text-zinc-800"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - atsResult.score / 100)}
                            className="text-primary transition-all duration-1000"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-2xl font-extrabold text-foreground">{atsResult.score}%</span>
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                            Match
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-foreground text-sm">Scan Match Status</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {atsResult.score >= 85
                            ? "Excellent! Your resume matches this job description very closely."
                            : atsResult.score >= 65
                            ? "Good start. We found a few minor gaps in keywords and skills."
                            : "Low alignment. Consider tailoring your experience bullet points and skills lists."}
                        </p>
                      </div>
                    </div>

                    {/* Breakdown List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Category Breakdown
                      </h4>
                      <div className="space-y-2">
                        {atsResult.breakdown.map((cat, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-muted/20 border border-border/50 rounded-xl space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-foreground">{cat.category}</span>
                              <span className="text-primary">
                                {cat.score} / {cat.maxScore}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {cat.feedback}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Suggestions */}
                    {atsResult.suggestions && atsResult.suggestions.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                          Key Suggestions for Improvement
                        </h4>
                        <ul className="list-disc pl-5 space-y-1.5">
                          {atsResult.suggestions.map((sug, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground leading-relaxed">
                              {sug}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Live PDF Preview (hidden on mobile unless preview tab is active) */}
        <div
          className={`lg:col-span-6 flex flex-col ${
            mobileMode === "edit" ? "hidden lg:flex" : "flex"
          }`}
        >
          <ResumePreview data={getResumeData()} title={title} />
        </div>
      </div>
    </div>
  );
}
