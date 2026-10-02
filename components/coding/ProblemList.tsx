"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, BookOpen } from "lucide-react";

interface ProgressItem {
  topic: string;
  problemsSolved: number;
  streak: number;
  lastActive: string | null;
}

interface ProblemListProps {
  progress: ProgressItem[];
  onUpdate: () => void;
}

const TOPIC_COLORS: Record<string, string> = {
  "Arrays": "from-purple-500 to-indigo-500",
  "Strings": "from-violet-500 to-purple-400",
  "Linked Lists": "from-purple-600 to-pink-500",
  "Stacks & Queues": "from-indigo-500 to-cyan-400",
  "Trees": "from-emerald-500 to-teal-400",
  "Graphs": "from-teal-500 to-indigo-500",
  "Dynamic Programming": "from-pink-500 to-rose-400",
  "Recursion": "from-purple-500 to-indigo-400",
  "Sorting": "from-amber-500 to-yellow-400",
  "Binary Search": "from-indigo-500 to-sky-400",
  "Hashing": "from-fuchsia-500 to-purple-500",
  "Heaps": "from-purple-500 to-emerald-400",
};

const MAX_PROBLEMS: Record<string, number> = {
  "Arrays": 80, "Strings": 60, "Linked Lists": 40, "Stacks & Queues": 30,
  "Trees": 60, "Graphs": 70, "Dynamic Programming": 80, "Recursion": 40,
  "Sorting": 30, "Binary Search": 40, "Hashing": 50, "Heaps": 30,
};

export default function ProblemList({ progress, onUpdate }: ProblemListProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const logProblem = async (topic: string) => {
    setUpdating(topic);
    try {
      const res = await fetch("/api/coding/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, increment: 1 }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Problem logged!", { description: `+1 ${topic}` });
      onUpdate();
    } catch (err: any) {
      toast.error("Failed to log problem", { description: err.message });
    } finally {
      setUpdating(null);
    }
  };

  const getLevelLabel = (solved: number, max: number) => {
    const pct = (solved / max) * 100;
    if (pct >= 80) return { label: "Expert", color: "text-emerald-400" };
    if (pct >= 50) return { label: "Advanced", color: "text-purple-400" };
    if (pct >= 25) return { label: "Intermediate", color: "text-amber-400" };
    return { label: "Beginner", color: "text-gray-400" };
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {progress.map((item) => {
        const max = MAX_PROBLEMS[item.topic] || 50;
        const pct = Math.min(100, Math.round((item.problemsSolved / max) * 100));
        const gradient = TOPIC_COLORS[item.topic] || "from-purple-500 to-indigo-500";
        const { label: levelLabel, color: levelColor } = getLevelLabel(item.problemsSolved, max);

        return (
          <div
            key={item.topic}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-purple-500/40 hover:shadow-[0_8px_32px_rgba(139,92,246,0.15)] transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.3)]`}>
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm leading-tight group-hover:text-purple-300 transition-colors">{item.topic}</h3>
                  <p className={`text-[10px] font-semibold ${levelColor}`}>{levelLabel}</p>
                </div>
              </div>
              <button
                onClick={() => logProblem(item.topic)}
                disabled={updating === item.topic}
                className="p-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Log 1 problem solved"
              >
                {updating === item.topic
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Plus className="w-3.5 h-3.5" />
                }
              </button>
            </div>

            {/* Progress */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">{item.problemsSolved} / {max} problems</span>
                <span className="font-bold text-white">{pct}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700 shadow-[0_0_8px_rgba(168,85,247,0.5)]`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-white/5">
              <span>
                {item.streak > 0 ? `🔥 ${item.streak} day streak` : "No active streak"}
              </span>
              <span>
                {item.lastActive
                  ? `Last: ${new Date(item.lastActive).toLocaleDateString()}`
                  : "Not started"
                }
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
