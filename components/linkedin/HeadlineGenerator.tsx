"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Loader2, Copy, CheckCircle, Sparkles, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeadlineGeneratorProps {
  userRole?: string;
  userSkills?: string;
}

export default function HeadlineGenerator({ userRole, userSkills }: HeadlineGeneratorProps) {
  const [role, setRole] = useState(userRole || "");
  const [skills, setSkills] = useState(userSkills || "");
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const generate = async () => {
    if (!role.trim()) { toast.error("Please enter your target role"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/linkedin/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "headline", role, skills }),
      });
      if (!res.ok) throw new Error("Failed to generate headlines");
      const data = await res.json();
      setHeadlines(data.headlines || []);
      toast.success("Headlines generated!");
    } catch (err: any) {
      toast.error("Generation failed", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const copyHeadline = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_8px_32px_rgba(139,92,246,0.12)]">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.2)]">
          <Link2 className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="font-bold text-white text-base">Headline Generator</h3>
          <p className="text-xs text-gray-400">AI-crafted headlines to attract recruiters and rank in search</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">
            Target Role *
          </label>
          <input
            type="text"
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="e.g. Full Stack Developer, AI Engineer, Product Manager"
            className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all placeholder:text-gray-500"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">
            Core Skills & Specializations
          </label>
          <input
            type="text"
            value={skills}
            onChange={e => setSkills(e.target.value)}
            placeholder="e.g. React, Next.js, TypeScript, PostgreSQL, AWS"
            className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all placeholder:text-gray-500"
          />
        </div>
        <Button onClick={generate} disabled={loading || !role.trim()} variant="gradient" className="w-full py-3.5 shadow-[0_0_20px_rgba(139,92,246,0.4)]">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate 5 High-Impact Headlines
        </Button>
      </div>

      {headlines.length > 0 && (
        <div className="space-y-3 pt-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Generated Options</p>
          {headlines.map((h, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/40 hover:bg-white/[0.07] transition-all group"
            >
              <span className="text-xs font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2.5 py-1 rounded-lg shrink-0">{i + 1}</span>
              <p className="text-sm text-gray-200 flex-1 leading-relaxed">{h}</p>
              <button
                onClick={() => copyHeadline(h, i)}
                className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all opacity-0 group-hover:opacity-100"
                title="Copy headline"
              >
                {copied === i ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
