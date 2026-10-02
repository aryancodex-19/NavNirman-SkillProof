"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, User, Mail, GitBranch, Link2, Globe } from "lucide-react";
import TemplateSelector from "@/components/portfolio/TemplateSelector";
import PortfolioPreview from "@/components/portfolio/PortfolioPreview";
import { Button } from "@/components/ui/button";

interface PortfolioGeneratorClientProps {
  userResume?: {
    fullName?: string;
    email?: string;
    summary?: string;
    skills?: string;
    experience?: string;
    education?: string;
    targetRole?: string;
  };
  userProfile?: {
    name?: string;
    githubUrl?: string;
    linkedinUrl?: string;
  };
}

export default function PortfolioGeneratorClient({ userResume, userProfile }: PortfolioGeneratorClientProps) {
  const [template, setTemplate] = useState("modern");
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    name: userProfile?.name || userResume?.fullName || "",
    email: userResume?.email || "",
    role: userResume?.targetRole || "",
    github: userProfile?.githubUrl || "",
    linkedin: userProfile?.linkedinUrl || "",
    twitter: "",
    website: "",
  });
  
  const [activeResume, setActiveResume] = useState(userResume);

  React.useEffect(() => {
    const cached = localStorage.getItem("portfolio_resume_data");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setPersonalInfo(prev => ({
          ...prev,
          name: parsed.fullName || prev.name,
          email: parsed.email || prev.email,
          role: parsed.targetRole || prev.role,
        }));
        setActiveResume(parsed);
        localStorage.removeItem("portfolio_resume_data");
        toast.success("Resume data loaded from builder!");
      } catch (err) {
        console.error("Failed to parse cached resume data:", err);
      }
    }
  }, []);

  const generatePortfolio = async () => {
    setLoading(true);
    try {
      const resumeData = {
        fullName: personalInfo.name,
        email: personalInfo.email,
        targetRole: personalInfo.role,
        summary: activeResume?.summary || "",
        skills: activeResume?.skills ? JSON.parse(activeResume.skills) : [],
        experience: activeResume?.experience ? JSON.parse(activeResume.experience) : [],
        education: activeResume?.education ? JSON.parse(activeResume.education) : [],
      };

      const res = await fetch("/api/portfolio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, template, personalInfo }),
      });

      if (!res.ok) throw new Error("Failed to generate portfolio");
      const data = await res.json();
      setHtml(data.html);
      toast.success("Portfolio generated!", { description: "Preview it below or download the HTML" });
    } catch (err: any) {
      toast.error("Generation failed", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Setup Panel */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_8px_32px_rgba(139,92,246,0.12)]">
        {/* Template Selection */}
        <TemplateSelector selected={template} onSelect={setTemplate} />

        {/* Personal Info */}
        <div>
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 block">
            Personal Information & Links
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              { key: "name", label: "Full Name", icon: User, placeholder: "John Doe" },
              { key: "email", label: "Email", icon: Mail, placeholder: "john@example.com" },
              { key: "role", label: "Target Role", icon: Globe, placeholder: "Full Stack Developer" },
              { key: "github", label: "GitHub URL", icon: GitBranch, placeholder: "https://github.com/username" },
              { key: "linkedin", label: "LinkedIn URL", icon: Link2, placeholder: "https://linkedin.com/in/username" },
              { key: "twitter", label: "Twitter/X URL", icon: Link2, placeholder: "https://twitter.com/username" },
              { key: "website", label: "Personal Website URL", icon: Globe, placeholder: "https://mywebsite.com" },
            ].map(field => (
              <div key={field.key} className={field.key === "role" || field.key === "website" ? "sm:col-span-2" : ""}>
                <label className="text-xs font-semibold text-gray-300 mb-1.5 block flex items-center gap-1.5">
                  <field.icon className="w-3.5 h-3.5 text-purple-400" /> {field.label}
                </label>
                <input
                  type="text"
                  value={(personalInfo as any)[field.key]}
                  onChange={e => setPersonalInfo(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all placeholder:text-gray-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Data Source Info */}
        {activeResume && (
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl shadow-inner">
            <p className="text-xs text-purple-300 font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              Resume data synced — your portfolio will dynamically format your skills, projects & work history.
            </p>
          </div>
        )}

        <Button
          onClick={generatePortfolio}
          disabled={loading || !personalInfo.name}
          variant="gradient"
          className="w-full py-4 text-sm font-bold shadow-[0_0_25px_rgba(139,92,246,0.4)]"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating Custom Website...</>
            : <><Sparkles className="w-4 h-4 mr-2" /> Generate Portfolio Website</>
          }
        </Button>
      </div>

      {/* Preview */}
      {(html || loading) && (
        <div className="animate-fade-in">
          <PortfolioPreview
            html={html || ""}
            isLoading={loading && !html}
            onRegenerate={generatePortfolio}
          />
        </div>
      )}

      {!html && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
            <Globe className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="font-bold text-white text-base mb-1">No portfolio generated yet</h3>
          <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
            Select a template above, customize your contact details, and click Generate to produce your live site.
          </p>
        </div>
      )}
    </div>
  );
}
