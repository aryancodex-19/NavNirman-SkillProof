"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Loader2, Copy, CheckCircle, Sparkles, PenLine, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AboutRewriterProps {
  userRole?: string;
  userSkills?: string;
}

export default function AboutRewriter({ userRole, userSkills }: AboutRewriterProps) {
  const [role, setRole] = useState(userRole || "");
  const [skills, setSkills] = useState(userSkills || "");
  const [currentAbout, setCurrentAbout] = useState("");
  const [result, setResult] = useState<{ rewritten: string; tips: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const rewrite = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/linkedin/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "about", role, skills, currentText: currentAbout }),
      });
      if (!res.ok) throw new Error("Failed to rewrite");
      const data = await res.json();
      setResult(data);
      toast.success("About section rewritten!");
    } catch (err: any) {
      toast.error("Rewrite failed", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const copyText = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.rewritten);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_8px_32px_rgba(139,92,246,0.12)]">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.2)]">
          <PenLine className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="font-bold text-white text-base">About Section Rewriter</h3>
          <p className="text-xs text-gray-400">Transform your bio into an authentic, recruiter-aligned story</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">Target Role</label>
          <input
            type="text"
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="Frontend Developer"
            className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all placeholder:text-gray-500"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">Skills / Highlights</label>
          <input
            type="text"
            value={skills}
            onChange={e => setSkills(e.target.value)}
            placeholder="React, Node.js, Python, System Design"
            className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all placeholder:text-gray-500"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">
          Current About Section <span className="text-gray-500 font-normal lowercase">(optional — leave blank to generate from scratch)</span>
        </label>
        <textarea
          value={currentAbout}
          onChange={e => setCurrentAbout(e.target.value)}
          placeholder="Paste your current LinkedIn About section here..."
          rows={4}
          className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all resize-none placeholder:text-gray-500"
        />
      </div>

      <Button onClick={rewrite} disabled={loading} variant="gradient" className="w-full py-3.5 shadow-[0_0_20px_rgba(139,92,246,0.4)]">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
        Rewrite with AI
      </Button>

      {result && (
        <div className="space-y-4 pt-2">
          {/* Rewritten text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Optimized About Section
              </p>
              <button
                onClick={copyText}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap shadow-inner">
              {result.rewritten}
            </div>
          </div>

          {/* Tips */}
          {result.tips && result.tips.length > 0 && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <p className="text-xs font-bold text-purple-300 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-purple-400" /> What was enhanced
              </p>
              <ul className="space-y-1.5">
                {result.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-gray-300 flex gap-2">
                    <span className="text-purple-400 shrink-0">→</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
