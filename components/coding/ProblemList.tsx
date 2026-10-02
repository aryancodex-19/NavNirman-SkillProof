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
  "Arrays": "from-blue-500 to-cyan-400",
  "Strings": "from-violet-500 to-purple-400",
  "Linked Lists": "from-pink-500 to-rose-400",
  "Stacks & Queues": "from-orange-500 to-amber-400",
  "Trees": "from-green-500 to-emerald-400",
  "Graphs": "from-teal-500 to-cyan-400",
  "Dynamic Programming": "from-red-500 to-orange-400",
  "Recursion": "from-purple-500 to-indigo-400",
  "Sorting": "from-yellow-500 to-amber-400",
  "Binary Search": "from-sky-500 to-blue-400",
  "Hashing": "from-fuchsia-500 to-pink-400",
  "Heaps": "from-lime-500 to-green-400",
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
    if (pct >= 80) return { label: "Expert", color: "text-success" };
    if (pct >= 50) return { label: "Advanced", color: "text-primary" };
    if (pct >= 25) return { label: "Intermediate", color: "text-warning" };
    return { label: "Beginner", color: "text-muted-foreground" };
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {progress.map((item) => {
        const max = MAX_PROBLEMS[item.topic] || 50;
        const pct = Math.min(100, Math.round((item.problemsSolved / max) * 100));
        const gradient = TOPIC_COLORS[item.topic] || "from-primary to-accent";
        const { label: levelLabel, color: levelColor } = getLevelLabel(item.problemsSolved, max);

        return (
          <div
            key={item.topic}
            className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm leading-tight">{item.topic}</h3>
                  <p className={`text-[10px] font-semibold ${levelColor}`}>{levelLabel}</p>
                </div>
              </div>
              <button
                onClick={() => logProblem(item.topic)}
                disabled={updating === item.topic}
                className="p-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100"
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
                <span className="text-muted-foreground">{item.problemsSolved} / {max} problems</span>
                <span className="font-bold text-foreground">{pct}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
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
