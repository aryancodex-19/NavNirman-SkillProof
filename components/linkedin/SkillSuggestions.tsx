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
    if (importance === "High") return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    if (importance === "Medium") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  };

  const filtered = filter === "All" ? suggestions : suggestions.filter(s => s.importance === filter);

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_8px_32px_rgba(139,92,246,0.12)]">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.2)]">
          <Tag className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="font-bold text-white text-base">Skill Suggestions & Gaps</h3>
          <p className="text-xs text-gray-400">In-demand competencies top tech recruiters search for</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">Target Role</label>
          <input
            type="text"
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="Software Engineer"
            className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all placeholder:text-gray-500"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">Your Current Skills</label>
          <input
            type="text"
            value={skills}
            onChange={e => setSkills(e.target.value)}
            placeholder="React, TypeScript, Python..."
            className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all placeholder:text-gray-500"
          />
        </div>
      </div>

      <Button onClick={suggest} disabled={loading || !role.trim()} variant="gradient" className="w-full py-3.5 shadow-[0_0_20px_rgba(139,92,246,0.4)]">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
        Analyze Skill Gaps
      </Button>

      {suggestions.length > 0 && (
        <div className="pt-2 space-y-4">
          {/* Filter tabs */}
          <div className="flex gap-2">
            {["All", "High", "Medium", "Low"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                  filter === f
                    ? "bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                    : "bg-white/5 text-gray-400 border-white/10 hover:border-purple-500/30 hover:text-white"
                }`}
              >
                {f} {f !== "All" && `(${suggestions.filter(s => s.importance === f).length})`}
              </button>
            ))}
          </div>

          {/* Skill cards */}
          <div className="grid grid-cols-1 gap-2.5">
            {filtered.map((skill, i) => (
              <div
                key={i}
                className="flex items-start gap-3.5 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/40 hover:bg-white/[0.07] transition-all"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-sm">{skill.skill}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getImportanceBadge(skill.importance)}`}>
                      {skill.importance} Priority
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{skill.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
