"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { GitBranch, TrendingUp, TrendingDown, Minus, Zap, Activity } from "lucide-react";

interface CommitActivityProps {
  data: {
    score: number;
    totalEvents: number;
    activeDays: number;
    recentPushEvents: number;
    recentlyActiveRepos: number;
    consistencyScore: number;
    trend: "up" | "down" | "steady";
    heatmapData: { date: string; count: number }[];
    dailyAverage: number;
    weeklyAverage: number;
    monthlyAverage: number;
  };
}

const HEATMAP_COLORS = [
  "bg-white/[0.03]",
  "bg-indigo-500/20",
  "bg-indigo-500/40",
  "bg-indigo-500/60",
  "bg-indigo-500/80",
  "bg-indigo-500",
];

function getHeatmapColor(count: number): string {
  if (count === 0) return HEATMAP_COLORS[0];
  if (count <= 1) return HEATMAP_COLORS[1];
  if (count <= 3) return HEATMAP_COLORS[2];
  if (count <= 5) return HEATMAP_COLORS[3];
  if (count <= 8) return HEATMAP_COLORS[4];
  return HEATMAP_COLORS[5];
}

const TrendIcon = ({ trend }: { trend: "up" | "down" | "steady" }) => {
  if (trend === "up") return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-yellow-400" />;
};

export default function CommitActivity({ data }: CommitActivityProps) {
  // Organize heatmap: 53 columns (weeks) × 7 rows (days)
  const heatmapGrid = useMemo(() => {
    const weeks: { date: string; count: number }[][] = [];
    let currentWeek: { date: string; count: number }[] = [];

    // Pad the start so the first entry aligns to the correct day of week
    const firstDate = data.heatmapData[0]?.date;
    if (firstDate) {
      const dayOfWeek = new Date(firstDate).getDay();
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push({ date: "", count: -1 }); // -1 = empty cell
      }
    }

    data.heatmapData.forEach((d) => {
      currentWeek.push(d);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [data.heatmapData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl p-6"
    >
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <GitBranch className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Commit Activity</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Last 365 days of contribution data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] rounded-lg border border-white/5">
          <TrendIcon trend={data.trend} />
          <span className="text-xs font-semibold text-gray-300 capitalize">
            {data.trend}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Daily Avg", value: data.dailyAverage.toString(), icon: Activity },
          { label: "Weekly Avg", value: data.weeklyAverage.toString(), icon: Zap },
          { label: "Consistency", value: `${data.consistencyScore}%`, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center"
          >
            <Icon className="w-3.5 h-3.5 text-indigo-400 mx-auto mb-1.5" />
            <p className="text-lg font-black text-white">{value}</p>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Contribution Heatmap */}
      <div className="space-y-2">
        <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
          Contribution Heatmap
        </p>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-[3px] min-w-[680px]">
            {heatmapGrid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <motion.div
                    key={`${wi}-${di}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: wi * 0.008 + di * 0.01,
                      duration: 0.2,
                    }}
                    title={
                      day.count >= 0
                        ? `${day.date}: ${day.count} contributions`
                        : ""
                    }
                    className={`w-[11px] h-[11px] rounded-[2px] transition-colors ${
                      day.count < 0 ? "bg-transparent" : getHeatmapColor(day.count)
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 pt-1">
          <span className="text-[10px] text-gray-600 mr-1">Less</span>
          {HEATMAP_COLORS.map((color, i) => (
            <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${color}`} />
          ))}
          <span className="text-[10px] text-gray-600 ml-1">More</span>
        </div>
      </div>

      {/* Score Indicator */}
      <div className="mt-5 flex items-center justify-between px-1">
        <span className="text-xs text-gray-500 font-medium">Activity Score</span>
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.score}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            />
          </div>
          <span className="text-sm font-bold text-indigo-400">{data.score}</span>
        </div>
      </div>
    </motion.div>
  );
}
