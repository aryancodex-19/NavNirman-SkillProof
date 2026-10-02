"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Skill {
  skill: string;
  importance: "High" | "Medium" | "Low";
  reason: string;
}

interface SkillSuggestionsProps {
  userRole?: string;
  userSkills?: string;
}

export default function SkillSuggestions({ userRole, userSkills }: SkillSuggestionsProps) {
  const [role, setRole] = useState(userRole || "");
  const [skills, setSkills] = useState(userSkills || "");
  const [suggestions, setSuggestions] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"All" | "High" | "Medium" | "Low">("All");

  const suggest = async () => {
    if (!role.trim()) { toast.error("Please enter your role"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/linkedin/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "skills", role, skills }),
      });
      if (!res.ok) throw new Error("Failed to get suggestions");
      const data = await res.json();
      setSuggestions(data.suggestedSkills || []);
      toast.success("Skills analyzed!");
    } catch (err: any) {
      toast.error("Failed to suggest skills", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getImportanceBadge = (importance: string) => {
    if (importance === "High") return "bg-success/10 text-success border-success/20";
    if (importance === "Medium") return "bg-warning/10 text-warning border-warning/20";
    return "bg-muted text-muted-foreground border-border";
  };

  const filtered = filter === "All" ? suggestions : suggestions.filter(s => s.importance === filter);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-success/10 rounded-xl">
          <Tag className="w-5 h-5 text-success" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-sm">Skill Suggestions</h3>
          <p className="text-xs text-muted-foreground">In-demand skills recruiters search for</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Target Role</label>
          <input
            type="text"
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="Software Engineer"
            className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Your Current Skills</label>
          <input
            type="text"
            value={skills}
            onChange={e => setSkills(e.target.value)}
            placeholder="React, Python..."
            className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <Button onClick={suggest} disabled={loading || !role.trim()} variant="gradient" className="w-full">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
        Analyze Skill Gaps
      </Button>

      {suggestions.length > 0 && (
        <div>
          {/* Filter tabs */}
          <div className="flex gap-2 mb-4">
            {["All", "High", "Medium", "Low"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:border-primary/30"
                }`}
              >
                {f} {f !== "All" && `(${suggestions.filter(s => s.importance === f).length})`}
              </button>
            ))}
          </div>

          {/* Skill cards */}
          <div className="grid grid-cols-1 gap-2">
            {filtered.map((skill, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-muted rounded-xl border border-border hover:border-primary/20 transition-all"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-foreground text-sm">{skill.skill}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getImportanceBadge(skill.importance)}`}>
                      {skill.importance}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{skill.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
