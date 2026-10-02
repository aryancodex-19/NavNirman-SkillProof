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
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        {/* Template Selection */}
        <TemplateSelector selected={template} onSelect={setTemplate} />

        {/* Personal Info */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
            Personal Information
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <label className="text-xs font-semibold text-foreground mb-1.5 block flex items-center gap-1.5">
                  <field.icon className="w-3 h-3 text-muted-foreground" /> {field.label}
                </label>
                <input
                  type="text"
                  value={(personalInfo as any)[field.key]}
                  onChange={e => setPersonalInfo(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-[#0a0a0f] text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Data Source Info */}
        {activeResume && (
          <div className="p-3 bg-success/5 border border-success/20 rounded-xl">
            <p className="text-xs text-success font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Resume data detected — your portfolio will include your skills, experience & education automatically.
            </p>
          </div>
        )}

        <Button
          onClick={generatePortfolio}
          disabled={loading || !personalInfo.name}
          variant="gradient"
          className="w-full py-3 text-sm cursor-pointer"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating Portfolio...</>
            : <><Sparkles className="w-4 h-4 mr-2" /> Generate Portfolio</>
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
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
            <Globe className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-foreground mb-2">No portfolio generated yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Choose a template, fill in your info, and click Generate to create your portfolio in seconds.
          </p>
        </div>
      )}
    </div>
  );
}
