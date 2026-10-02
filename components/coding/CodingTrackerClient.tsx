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
          { label: "Problems Solved", value: totalSolved, icon: Code2, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
          { label: "Best Streak", value: `${maxStreak}d`, icon: Flame, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
          { label: "Topics Active", value: progress.filter(p => p.problemsSolved > 0).length, icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { label: "Topics Total", value: progress.length, icon: Code2, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-[0_8px_32px_rgba(139,92,246,0.1)] hover:border-purple-500/30 transition-all">
            <div className={`p-2.5 rounded-xl border ${color} shadow-[0_0_12px_rgba(168,85,247,0.15)]`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xl font-black text-white bg-gradient-to-b from-white to-gray-200 bg-clip-text">{value}</p>
              <p className="text-xs text-gray-400 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <div className="bg-white/5 backdrop-blur-md p-1 rounded-xl flex gap-1 border border-white/10">
          {[
            { id: "mastery", label: "Topic Mastery" },
            { id: "problems", label: "Log Problems" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={fetchProgress}
          className="ml-auto p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-purple-500/40 hover:bg-white/10 transition-all cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : activeTab === "mastery" ? (
        <TopicMastery progress={progress} />
      ) : (
        <ProblemList progress={progress} onUpdate={fetchProgress} />
      )}
    </div>
  );
}
