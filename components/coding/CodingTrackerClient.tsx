"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Code2, RefreshCw, TrendingUp, Flame } from "lucide-react";
import ProblemList from "@/components/coding/ProblemList";
import TopicMastery from "@/components/coding/TopicMastery";

interface ProgressItem {
  topic: string;
  problemsSolved: number;
  streak: number;
  lastActive: string | null;
}

export default function CodingTrackerClient() {
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"problems" | "mastery">("mastery");

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coding/progress");
      if (!res.ok) throw new Error("Failed to load progress");
      const data = await res.json();
      setProgress(data.progress || []);
    } catch (err: any) {
      toast.error("Failed to load progress", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const totalSolved = progress.reduce((sum, p) => sum + p.problemsSolved, 0);
  const maxStreak = Math.max(0, ...progress.map(p => p.streak));

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Problems Solved", value: totalSolved, icon: Code2, color: "text-primary bg-primary/10" },
          { label: "Best Streak", value: `${maxStreak}d`, icon: Flame, color: "text-orange-500 bg-orange-500/10" },
          { label: "Topics Active", value: progress.filter(p => p.problemsSolved > 0).length, icon: TrendingUp, color: "text-success bg-success/10" },
          { label: "Topics Total", value: progress.length, icon: Code2, color: "text-accent bg-accent/10" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <div className="bg-muted p-1 rounded-xl flex gap-1">
          {[
            { id: "mastery", label: "Topic Mastery" },
            { id: "problems", label: "Log Problems" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={fetchProgress}
          className="ml-auto p-2 bg-muted border border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-40 rounded-2xl skeleton" />)}
        </div>
      ) : activeTab === "mastery" ? (
        <TopicMastery progress={progress} />
      ) : (
        <ProblemList progress={progress} onUpdate={fetchProgress} />
      )}
    </div>
  );
}
