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
          <div key={stat.label} className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center shadow-[0_8px_32px_rgba(139,92,246,0.1)] hover:border-purple-500/30 transition-all">
            <p className="text-2xl font-black text-white bg-gradient-to-b from-white to-gray-200 bg-clip-text">
              {stat.value}<span className="text-base font-bold text-purple-400">{stat.suffix}</span>
            </p>
            <p className="text-xs font-semibold text-gray-300 mt-1">{stat.label}</p>
            <p className="text-[10px] text-gray-400">{stat.sublabel}</p>
          </div>
        ))}
      </div>

      {/* Mastery Leaderboard */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(139,92,246,0.12)]">
        <h3 className="font-bold text-white text-sm mb-5 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-purple-400" />
          <span>Topic Mastery Ranking</span>
        </h3>
        <div className="space-y-3.5">
          {sorted.map((item, rank) => (
            <div key={item.topic} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.02] transition-colors">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                rank === 0 ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30" :
                rank === 1 ? "bg-slate-300/20 text-slate-300 border border-slate-300/30" :
                rank === 2 ? "bg-orange-400/20 text-orange-400 border border-orange-400/30" :
                "bg-white/5 text-gray-400 border border-white/10"
              }`}>
                {rank < 3 ? ["🥇", "🥈", "🥉"][rank] : rank + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-white truncate">{item.topic}</span>
                  <span className="text-xs font-bold text-gray-400 ml-2 shrink-0">{item.problemsSolved} solved</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      item.pct >= 80 ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : item.pct >= 50 ? "bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" : item.pct >= 25 ? "bg-amber-400" : "bg-gray-600"
                    }`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
              <span className={`text-xs font-bold shrink-0 ${
                item.pct >= 80 ? "text-emerald-400" : item.pct >= 50 ? "text-purple-400" : item.pct >= 25 ? "text-amber-400" : "text-gray-400"
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
