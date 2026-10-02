"use client";

import React from "react";
import { motion } from "framer-motion";
import { BarChart3, Layers } from "lucide-react";

interface LanguageStatsProps {
  data: {
    score: number;
    languages: { name: string; bytes: number; percentage: number }[];
    techStack: { category: string; languages: string[] }[];
    totalLanguages: number;
    primaryLanguage: string;
  };
}

// Language color mapping (GitHub-style)
const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Shell: "#89e051",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  R: "#198CE7",
  MATLAB: "#e16737",
  "Jupyter Notebook": "#DA5B0B",
  Dockerfile: "#384d54",
  HCL: "#844FBA",
};

function getLangColor(name: string): string {
  return LANG_COLORS[name] || "#6366f1";
}

const CATEGORY_ICONS: Record<string, string> = {
  Frontend: "🎨",
  Backend: "⚙️",
  Mobile: "📱",
  Systems: "🔧",
  "Data Science": "📊",
  DevOps: "🚀",
};

export default function LanguageStats({ data }: LanguageStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl p-6"
    >
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 rounded-xl border border-violet-500/20">
            <BarChart3 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Language Stats</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {data.totalLanguages} languages across your repos
            </p>
          </div>
        </div>
        <div className="px-3 py-1.5 bg-white/[0.03] rounded-lg border border-white/5">
          <span className="text-xs font-semibold text-gray-300">
            Primary: {data.primaryLanguage}
          </span>
        </div>
      </div>

      {/* Language Bars */}
      <div className="space-y-3 mb-6">
        {data.languages.slice(0, 6).map((lang, i) => (
          <div key={lang.name} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: getLangColor(lang.name) }}
                />
                <span className="text-sm font-semibold text-gray-200">
                  {lang.name}
                </span>
              </div>
              <span className="text-xs font-bold text-gray-400">
                {lang.percentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${lang.percentage}%` }}
                transition={{
                  duration: 1,
                  ease: "easeOut",
                  delay: 0.3 + i * 0.1,
                }}
                className="h-full rounded-full"
                style={{ backgroundColor: getLangColor(lang.name) }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Full Distribution Bar */}
      <div className="space-y-2 mb-6">
        <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
          Distribution
        </p>
        <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden flex">
          {data.languages.slice(0, 8).map((lang) => (
            <motion.div
              key={lang.name}
              initial={{ width: 0 }}
              animate={{ width: `${lang.percentage}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ backgroundColor: getLangColor(lang.name) }}
              title={`${lang.name}: ${lang.percentage}%`}
            />
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      {data.techStack.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-violet-400" />
            <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
              Tech Stack
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {data.techStack.map(({ category, languages }) => (
              <div
                key={category}
                className="bg-white/[0.02] border border-white/5 rounded-xl p-3"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm">
                    {CATEGORY_ICONS[category] || "📦"}
                  </span>
                  <span className="text-[11px] font-bold text-gray-300">
                    {category}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {languages.map((l) => (
                    <span
                      key={l}
                      className="px-2 py-0.5 text-[10px] font-semibold rounded-md border"
                      style={{
                        backgroundColor: `${getLangColor(l)}15`,
                        borderColor: `${getLangColor(l)}30`,
                        color: getLangColor(l),
                      }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Indicator */}
      <div className="mt-5 flex items-center justify-between px-1">
        <span className="text-xs text-gray-500 font-medium">Language Score</span>
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.score}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
            />
          </div>
          <span className="text-sm font-bold text-violet-400">{data.score}</span>
        </div>
      </div>
    </motion.div>
  );
}
