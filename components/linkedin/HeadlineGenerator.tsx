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
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-500/10 rounded-xl">
          <Link2 className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-sm">Headline Generator</h3>
          <p className="text-xs text-muted-foreground">AI-crafted headlines to attract recruiters</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Target Role *</label>
          <input
            type="text"
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="e.g. Frontend Developer, Data Scientist"
            className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">Skills</label>
          <input
            type="text"
            value={skills}
            onChange={e => setSkills(e.target.value)}
            placeholder="e.g. React, Python, Machine Learning"
            className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button onClick={generate} disabled={loading || !role.trim()} variant="gradient" className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate 5 Headlines
        </Button>
      </div>

      {headlines.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Results</p>
          {headlines.map((h, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 bg-muted rounded-xl border border-border hover:border-primary/20 transition-all group"
            >
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg shrink-0">{i + 1}</span>
              <p className="text-sm text-foreground flex-1 leading-relaxed">{h}</p>
              <button
                onClick={() => copyHeadline(h, i)}
                className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
              >
                {copied === i ? <CheckCircle className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
