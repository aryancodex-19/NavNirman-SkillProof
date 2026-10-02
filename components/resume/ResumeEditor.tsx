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
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { type ResumeData, type Experience, type Education } from "@/types";
import ResumePreview from "./ResumePreview";

interface ResumeEditorProps {
  initialData: any;
  onDelete: () => void;
}

export default function ResumeEditor({ initialData, onDelete }: ResumeEditorProps) {
  // Resume active data
  const [currentId, setCurrentId] = useState<string | null>(initialData?.id || null);
  const [title, setTitle] = useState(initialData?.title || "My Resume");
  const [fullName, setFullName] = useState(initialData?.fullName || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [phoneError, setPhoneError] = useState("");
  const [summary, setSummary] = useState(initialData?.summary || "");
  const [skills, setSkills] = useState<string[]>(initialData?.skills || []);
  const [experience, setExperience] = useState<Experience[]>(
    (initialData?.experience || []).map((exp: any) => ({
      company: exp.company || "",
      role: exp.role || "",
      duration: exp.duration || "",
      bullets: exp.bullets || exp.achievements || [""],
    }))
  );
  const [education, setEducation] = useState<Education[]>(initialData?.education || []);
  const [targetRole, setTargetRole] = useState(initialData?.targetRole || "");
  const [atsScore, setAtsScore] = useState<number | null>(initialData?.atsScore || null);

  // States
  const [activeTab, setActiveTab] = useState<"details" | "skills" | "experience" | "education">("details");
  const [mobileMode, setMobileMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // AI loading states
  const [rewritingSummary, setRewritingSummary] = useState(false);
  const [rewritingBulletIdx, setRewritingBulletIdx] = useState<{ expIdx: number; bulletIdx: number } | null>(null);
  const [rewritingAllExp, setRewritingAllExp] = useState(false);

  // Skill input helper
  const [skillInput, setSkillInput] = useState("");

  // Validate phone on load
  useEffect(() => {
    if (initialData?.phone) {
      validatePhoneNumber(initialData.phone);
    }
  }, [initialData]);

  // Phone validation helper
  const validatePhoneNumber = (val: string) => {
    const cleaned = val.replace(/[\s-]/g, "");
    const regex = /^\+91[6-9]\d{9}$/;
    if (!val) {
      setPhoneError("");
    } else if (!val.startsWith("+91")) {
      setPhoneError("Phone number must start with +91");
    } else if (!regex.test(cleaned)) {
      setPhoneError("Please enter a valid 10-digit Indian phone number after +91 (e.g. +91 98765 43210)");
    } else {
      setPhoneError("");
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    validatePhoneNumber(val);
  };

  // Get synchronized data structure
  const getResumeData = (): ResumeData => ({
    fullName,
    email,
    phone,
    summary,
    skills,
    experience: experience.map(exp => ({
      company: exp.company,
      role: exp.role,
      duration: exp.duration,
      bullets: exp.bullets || [],
    })),
    education,
  });

  // Save changes to database
  const handleSave = async (showToast = true) => {
    if (phoneError) {
      toast.error("Please fix the validation errors before saving.", {
        description: phoneError
      });
      return;
    }
    
    setSaving(true);
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
      if (showToast) {
        toast.success("Resume saved successfully!");
      }
      return data;
    } catch (err: any) {
      console.error(err);
      if (showToast) {
        toast.error(err.message || "Could not save resume.");
      }
    } finally {
      setSaving(false);
    }
  };

  // Delete resume from database
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this resume? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      if (currentId) {
        const res = await fetch("/api/resume/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: currentId }),
        });

        if (!res.ok) {
          throw new Error("Failed to delete resume");
        }
        toast.success("Resume deleted successfully!");
      }
      onDelete();
    } catch (err: any) {
      toast.error(err.message || "Error deleting resume");
    } finally {
      setDeleting(false);
    }
  };

  // Send to ATS scanner flow
  const handleSendToATS = async () => {
    if (phoneError) {
      toast.error("Please fix validation errors before sending to ATS.");
      return;
    }
    // Save draft first
    await handleSave(false);

    const plainTextResume = `
${fullName.toUpperCase()}
${email} | ${phone}
${targetRole ? `Target Role: ${targetRole}` : ""}

PROFESSIONAL SUMMARY
${summary}

SKILLS
${skills.join(", ")}

WORK EXPERIENCE
${experience
  .map(
    (exp) => `
${exp.role} at ${exp.company} (${exp.duration})
${(exp.bullets || []).map((b) => `• ${b}`).join("\n")}`
  )
  .join("\n")}

EDUCATION
${education
  .map(
    (edu) => `
${edu.degree} from ${edu.school} (${edu.year}) ${edu.gpa ? `GPA: ${edu.gpa}` : ""}`
  )
  .join("\n")}
`.trim();

    localStorage.setItem("ats_resume_text", plainTextResume);
    toast.success("Resume text sent to ATS Scanner!");
    window.location.href = "/dashboard/ats";
  };

  // Continue button click handler
  const handleContinue = (nextTab: "details" | "skills" | "experience" | "education") => {
    setActiveTab(nextTab);
    const formElement = document.getElementById("resume-editor-tabs-container");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    if (!updated[expIdx].bullets) {
      updated[expIdx].bullets = [];
    }
    updated[expIdx].bullets.push("");
    setExperience(updated);
  };

  const handleUpdateBullet = (expIdx: number, bulletIdx: number, value: string) => {
    const updated = [...experience];
    if (!updated[expIdx].bullets) {
      updated[expIdx].bullets = [];
    }
    updated[expIdx].bullets[bulletIdx] = value;
    setExperience(updated);
  };

  const handleRemoveBullet = (expIdx: number, bulletIdx: number) => {
    const updated = [...experience];
    if (updated[expIdx].bullets) {
      updated[expIdx].bullets.splice(bulletIdx, 1);
      setExperience(updated);
    }
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

  // AI helper: Rewrite Professional Summary
  const handleAIRewriteSummary = async () => {
    if (!targetRole) {
      toast.warning("Please specify a target role first!");
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
      if (updatedExp[expIdx].bullets) {
        updatedExp[expIdx].bullets[bulletIdx] = data.bullet;
      }
      setExperience(updatedExp);
      toast.success("Achievement optimized!");
    } catch (err) {
      toast.error("Failed to optimize achievement");
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
        toast.success("All experience entry achievements rewritten!");
      }
    } catch (err) {
      toast.error("Failed to optimize experience section");
    } finally {
      setRewritingAllExp(false);
    }
  };

  return (
    <div id="resume-editor-tabs-container" className="h-full flex flex-col gap-6 animate-fade-in">
      {/* Top Action Bar */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onDelete}
            className="p-2 border border-white/5 bg-zinc-950 hover:bg-zinc-900 text-muted-foreground hover:text-foreground rounded-xl transition-all shadow-sm"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold bg-transparent border-b border-transparent hover:border-white/10 focus:border-indigo-500 focus:outline-none text-foreground py-0.5 px-1 max-w-[200px] sm:max-w-xs transition-colors"
              title="Click to rename resume title"
            />
            <p className="text-xs text-muted-foreground">Resume Workspace Editor</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Mobile View Toggle */}
          <div className="lg:hidden flex border border-white/5 bg-zinc-950 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setMobileMode("edit")}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                mobileMode === "edit" ? "bg-indigo-600 text-white" : "text-muted-foreground"
              }`}
            >
              Edit Form
            </button>
            <button
              onClick={() => setMobileMode("preview")}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                mobileMode === "preview" ? "bg-indigo-600 text-white" : "text-muted-foreground"
              }`}
            >
              PDF Preview
            </button>
          </div>

          <button
            onClick={handleSendToATS}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-white/5 bg-zinc-950 hover:bg-zinc-900 text-foreground font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] shrink-0 w-full sm:w-auto text-xs"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span>📊 Send to ATS Scanner</span>
          </button>

          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-95 text-white font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] shrink-0 w-full sm:w-auto text-xs disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Draft</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] shrink-0 w-full sm:w-auto text-xs disabled:opacity-50"
            title="Delete Resume"
          >
            <Trash className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-[600px]">
        {/* Left Form Panel */}
        <div
          className={`lg:col-span-6 flex flex-col gap-6 no-print ${
            mobileMode === "preview" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Section Selector Tabs */}
          <div className="flex border-b border-white/5 overflow-x-auto gap-2 scrollbar-none">
            {[
              { id: "details", label: "Personal Info", icon: User },
              { id: "skills", label: "Skills", icon: Wrench },
              { id: "experience", label: "Work Experience", icon: Briefcase },
              { id: "education", label: "Education", icon: GraduationCap },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-400 font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content */}
          <div className="flex-1 space-y-6">
            {/* Personal Info Tab */}
            {activeTab === "details" && (
              <div className="glass-card p-6 border border-white/5 rounded-2xl space-y-4 bg-zinc-950/40">
                <h3 className="font-bold text-gray-200 text-base border-b border-white/5 pb-2">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-zinc-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-foreground text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Target Role
                    </label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="Software Engineer"
                      className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-zinc-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-foreground text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane.doe@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-zinc-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-foreground text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="+91 98765 43210"
                      className={`w-full px-4 py-2.5 rounded-xl border bg-zinc-950 focus:outline-none text-sm transition-all ${
                        phoneError ? "border-red-500/50 focus:border-red-500" : "border-white/5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      }`}
                    />
                    {phoneError && (
                      <p className="text-[10px] text-red-400 font-bold flex items-center gap-1 mt-1 animate-fade-in">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{phoneError}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Professional Summary
                    </label>
                    <button
                      onClick={handleAIRewriteSummary}
                      disabled={rewritingSummary}
                      type="button"
                      className="flex items-center gap-1 text-xs text-indigo-400 font-bold hover:text-indigo-300 disabled:opacity-50"
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
                    className="w-full px-4 py-3 rounded-xl border border-white/5 bg-zinc-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-foreground text-sm transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Continue button to next section */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleContinue("skills")}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-gray-200 font-bold text-xs rounded-xl shadow transition-all hover:scale-[1.01]"
                  >
                    <span>Continue to Skills</span>
                    <ChevronRight className="w-4 h-4 text-indigo-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === "skills" && (
              <div className="glass-card p-6 border border-white/5 rounded-2xl space-y-4 bg-zinc-950/40">
                <h3 className="font-bold text-gray-200 text-base border-b border-white/5 pb-2">
                  Skills & Core Competencies
                </h3>

                <form onSubmit={handleAddSkill} className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Add skill (e.g. React, Node.js) and press Enter"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/5 bg-zinc-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-foreground text-sm transition-all"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition-all hover:scale-[1.01] text-xs"
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
                        className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-zinc-900 text-gray-200 text-xs font-semibold rounded-lg border border-white/5 group"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Navigation continues */}
                <div className="pt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={() => handleContinue("details")}
                    className="flex items-center gap-1 px-4 py-2.5 border border-white/5 bg-zinc-900 text-muted-foreground font-semibold text-xs rounded-xl hover:text-foreground"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleContinue("experience")}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-gray-200 font-bold text-xs rounded-xl shadow transition-all hover:scale-[1.01]"
                  >
                    <span>Continue to Experience</span>
                    <ChevronRight className="w-4 h-4 text-indigo-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Work Experience Tab */}
            {activeTab === "experience" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-200 text-base">Work Experience</h3>
                  <div className="flex items-center gap-2">
                    {experience.length > 0 && (
                      <button
                        onClick={handleAIRewriteAllExperience}
                        disabled={rewritingAllExp}
                        type="button"
                        className="flex items-center gap-1 px-3 py-1.5 border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-500/10 disabled:opacity-50"
                      >
                        {rewritingAllExp ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>AI Rewrite All</span>
                      </button>
                    )}
                    <button
                      onClick={handleAddExperience}
                      type="button"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Experience</span>
                    </button>
                  </div>
                </div>

                {experience.length === 0 ? (
                  <div className="glass-card p-6 border border-white/5 rounded-2xl text-center bg-zinc-950/40">
                    <p className="text-sm text-muted-foreground italic">No work experience entries added.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {experience.map((exp, expIdx) => (
                      <div
                        key={expIdx}
                        className="glass-card p-6 border border-white/5 rounded-2xl relative space-y-4 group/card bg-zinc-950/40"
                      >
                        <button
                          onClick={() => handleRemoveExperience(expIdx)}
                          type="button"
                          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg opacity-0 group-hover/card:opacity-100 transition-all"
                          title="Remove Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                              Company
                            </label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => handleUpdateExperience(expIdx, "company", e.target.value)}
                              placeholder="Google"
                              className="w-full px-3 py-2 rounded-lg border border-white/5 bg-zinc-950 focus:border-indigo-500 focus:outline-none text-foreground text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                              Role / Title
                            </label>
                            <input
                              type="text"
                              value={exp.role}
                              onChange={(e) => handleUpdateExperience(expIdx, "role", e.target.value)}
                              placeholder="Software Engineer"
                              className="w-full px-3 py-2 rounded-lg border border-white/5 bg-zinc-950 focus:border-indigo-500 focus:outline-none text-foreground text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                              Duration
                            </label>
                            <input
                              type="text"
                              value={exp.duration}
                              onChange={(e) => handleUpdateExperience(expIdx, "duration", e.target.value)}
                              placeholder="June 2023 - Present"
                              className="w-full px-3 py-2 rounded-lg border border-white/5 bg-zinc-950 focus:border-indigo-500 focus:outline-none text-foreground text-sm"
                            />
                          </div>
                        </div>

                        {/* Achievements / Bullets section */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                              Achievements & Key Accomplishments
                            </label>
                            <button
                              onClick={() => handleAddBullet(expIdx)}
                              type="button"
                              className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold hover:underline"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Achievement</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(exp.bullets || []).map((bullet, bulletIdx) => (
                              <div key={bulletIdx} className="flex gap-2 items-center group/bullet">
                                <input
                                  type="text"
                                  value={bullet}
                                  onChange={(e) => handleUpdateBullet(expIdx, bulletIdx, e.target.value)}
                                  placeholder="Managed a team of developers to deliver..."
                                  className="flex-1 px-3 py-2 rounded-lg border border-white/5 bg-zinc-950 focus:border-indigo-500 focus:outline-none text-foreground text-xs"
                                />

                                {/* AI bullet rewrite */}
                                <button
                                  onClick={() => handleAIRewriteBullet(expIdx, bulletIdx, bullet)}
                                  type="button"
                                  disabled={
                                    rewritingBulletIdx?.expIdx === expIdx &&
                                    rewritingBulletIdx?.bulletIdx === bulletIdx
                                  }
                                  className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg disabled:opacity-50 shrink-0"
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
                                  type="button"
                                  className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg group-hover/bullet:opacity-100 opacity-0 transition-opacity shrink-0"
                                  title="Delete Achievement"
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

                {/* Navigation continues */}
                <div className="pt-4 flex justify-between bg-transparent">
                  <button
                    type="button"
                    onClick={() => handleContinue("skills")}
                    className="flex items-center gap-1 px-4 py-2.5 border border-white/5 bg-zinc-900 text-muted-foreground font-semibold text-xs rounded-xl hover:text-foreground"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleContinue("education")}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-gray-200 font-bold text-xs rounded-xl shadow transition-all hover:scale-[1.01]"
                  >
                    <span>Continue to Education</span>
                    <ChevronRight className="w-4 h-4 text-indigo-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Education Tab */}
            {activeTab === "education" && (
              <div className="glass-card p-6 border border-white/5 rounded-2xl space-y-6 bg-zinc-950/40">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-200 text-base">Education History</h3>
                  <button
                    onClick={handleAddEducation}
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Education</span>
                  </button>
                </div>

                {education.length === 0 ? (
                  <div className="p-6 border border-dashed border-white/5 rounded-2xl text-center bg-zinc-950/20">
                    <p className="text-sm text-muted-foreground italic">No education entries added.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {education.map((edu, idx) => (
                      <div
                        key={idx}
                        className="glass-card p-6 border border-white/5 rounded-2xl relative space-y-4 group/card bg-zinc-950/40"
                      >
                        <button
                          onClick={() => handleRemoveEducation(idx)}
                          type="button"
                          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg opacity-0 group-hover/card:opacity-100 transition-all"
                          title="Remove Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                              School / University
                            </label>
                            <input
                              type="text"
                              value={edu.school}
                              onChange={(e) => handleUpdateEducation(idx, "school", e.target.value)}
                              placeholder="Stanford University"
                              className="w-full px-3 py-2 rounded-lg border border-white/5 bg-zinc-950 focus:border-indigo-500 focus:outline-none text-foreground text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                              Degree / Major
                            </label>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => handleUpdateEducation(idx, "degree", e.target.value)}
                              placeholder="B.S. in Computer Science"
                              className="w-full px-3 py-2 rounded-lg border border-white/5 bg-zinc-950 focus:border-indigo-500 focus:outline-none text-foreground text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                              Graduation Year / Range
                            </label>
                            <input
                              type="text"
                              value={edu.year}
                              onChange={(e) => handleUpdateEducation(idx, "year", e.target.value)}
                              placeholder="2026"
                              className="w-full px-3 py-2 rounded-lg border border-white/5 bg-zinc-950 focus:border-indigo-500 focus:outline-none text-foreground text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                              GPA (Optional)
                            </label>
                            <input
                              type="text"
                              value={edu.gpa}
                              onChange={(e) => handleUpdateEducation(idx, "gpa", e.target.value)}
                              placeholder="3.9"
                              className="w-full px-3 py-2 rounded-lg border border-white/5 bg-zinc-950 focus:border-indigo-500 focus:outline-none text-foreground text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Final step buttons */}
                <div className="pt-4 flex justify-between bg-transparent">
                  <button
                    type="button"
                    onClick={() => handleContinue("experience")}
                    className="flex items-center gap-1 px-4 py-2.5 border border-white/5 bg-zinc-900 text-muted-foreground font-semibold text-xs rounded-xl hover:text-foreground"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg transition-all hover:scale-[1.01]"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    <span>Save Resume Draft</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Panel (Hidden on mobile mode unless preview tab selected) */}
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
