"use client";

import React from "react";
import { Trophy } from "lucide-react";

interface ProgressItem {
  topic: string;
  problemsSolved: number;
  streak: number;
}

interface TopicMasteryProps {
  progress: ProgressItem[];
}

const MAX_PROBLEMS: Record<string, number> = {
  "Arrays": 80, "Strings": 60, "Linked Lists": 40, "Stacks & Queues": 30,
  "Trees": 60, "Graphs": 70, "Dynamic Programming": 80, "Recursion": 40,
  "Sorting": 30, "Binary Search": 40, "Hashing": 50, "Heaps": 30,
};

export default function TopicMastery({ progress }: TopicMasteryProps) {
  const totalSolved = progress.reduce((sum, p) => sum + p.problemsSolved, 0);
  const totalProblems = Object.values(MAX_PROBLEMS).reduce((a, b) => a + b, 0);
  const overallPct = Math.min(100, Math.round((totalSolved / totalProblems) * 100));
  const maxStreak = Math.max(0, ...progress.map(p => p.streak));
  const topicsStarted = progress.filter(p => p.problemsSolved > 0).length;

  // Sort by % mastered
  const sorted = [...progress]
    .map(p => ({ ...p, pct: Math.min(100, Math.round((p.problemsSolved / (MAX_PROBLEMS[p.topic] || 50)) * 100)) }))
    .sort((a, b) => b.pct - a.pct);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Solved", value: totalSolved.toString(), suffix: "", sublabel: `of ${totalProblems} total` },
          { label: "Overall Progress", value: overallPct.toString(), suffix: "%", sublabel: "All topics" },
          { label: "Best Streak", value: maxStreak.toString(), suffix: " days", sublabel: maxStreak > 0 ? "🔥 Keep it up!" : "Start solving!" },
          { label: "Topics Started", value: topicsStarted.toString(), suffix: `/${progress.length}`, sublabel: "Topics active" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-foreground">
              {stat.value}<span className="text-base font-bold text-primary">{stat.suffix}</span>
            </p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">{stat.label}</p>
            <p className="text-[10px] text-muted-foreground">{stat.sublabel}</p>
          </div>
        ))}
      </div>

      {/* Mastery Leaderboard */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" /> Topic Mastery Ranking
        </h3>
        <div className="space-y-3">
          {sorted.map((item, rank) => (
            <div key={item.topic} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                rank === 0 ? "bg-yellow-400/20 text-yellow-500" :
                rank === 1 ? "bg-slate-300/20 text-slate-400" :
                rank === 2 ? "bg-orange-400/20 text-orange-500" :
                "bg-muted text-muted-foreground"
              }`}>
                {rank < 3 ? ["🥇", "🥈", "🥉"][rank] : rank + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground truncate">{item.topic}</span>
                  <span className="text-xs font-bold text-muted-foreground ml-2 shrink-0">{item.problemsSolved} solved</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      item.pct >= 80 ? "bg-success" : item.pct >= 50 ? "bg-primary" : item.pct >= 25 ? "bg-warning" : "bg-muted-foreground/50"
                    }`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
              <span className={`text-xs font-bold shrink-0 ${
                item.pct >= 80 ? "text-success" : item.pct >= 50 ? "text-primary" : item.pct >= 25 ? "text-warning" : "text-muted-foreground"
              }`}>
                {item.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
