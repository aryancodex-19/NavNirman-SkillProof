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
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary/10 rounded-xl">
          <PenLine className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-sm">About Section Rewriter</h3>
          <p className="text-xs text-muted-foreground">Transform your bio into a compelling story</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Target Role</label>
          <input
            type="text"
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="Frontend Developer"
            className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Skills</label>
          <input
            type="text"
            value={skills}
            onChange={e => setSkills(e.target.value)}
            placeholder="React, Node.js, Python"
            className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-foreground mb-1.5 block">
          Current About Section <span className="text-muted-foreground font-normal">(leave blank to generate from scratch)</span>
        </label>
        <textarea
          value={currentAbout}
          onChange={e => setCurrentAbout(e.target.value)}
          placeholder="Paste your current LinkedIn About section here..."
          rows={4}
          className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      <Button onClick={rewrite} disabled={loading} variant="gradient" className="w-full">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
        Rewrite with AI
      </Button>

      {result && (
        <div className="space-y-4">
          {/* Rewritten text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">✨ Optimized About Section</p>
              <button
                onClick={copyText}
                className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
              >
                {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="p-4 bg-muted rounded-xl border border-border text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {result.rewritten}
            </div>
          </div>

          {/* Tips */}
          {result.tips && result.tips.length > 0 && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> What was improved
              </p>
              <ul className="space-y-1">
                {result.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-primary shrink-0">→</span> {tip}
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
