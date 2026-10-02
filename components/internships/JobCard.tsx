"use client";

import React from "react";
import { ExternalLink, Bookmark, BookmarkCheck, MapPin, Clock, DollarSign, Zap } from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  stipend: string;
  duration: string;
  skills: string[];
  description: string;
  applyUrl: string;
  matchScore: number;
}

interface JobCardProps {
  job: Job;
  isSaved: boolean;
  onSave: (job: Job) => void;
}

function getScoreColor(score: number) {
  if (score >= 80) return { text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", bar: "bg-emerald-400" };
  if (score >= 60) return { text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", bar: "bg-amber-400" };
  return { text: "text-red-400", bg: "bg-red-500/10 border-red-500/30", bar: "bg-red-400" };
}

function getTypeColor(type: string) {
  if (type === "Remote") return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
  if (type === "Hybrid") return "bg-amber-500/10 text-amber-300 border-amber-500/20";
  return "bg-purple-500/10 text-purple-300 border-purple-500/20";
}

export default function JobCard({ job, isSaved, onSave }: JobCardProps) {
  const scoreStyle = getScoreColor(job.matchScore);
  const typeStyle = getTypeColor(job.type);

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-purple-500/40 hover:shadow-[0_8px_32px_rgba(139,92,246,0.18)] hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-full animate-fade-in relative overflow-hidden">
      {/* Top subtle border highlight */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/20 to-transparent pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                <span className="text-xs font-bold text-white">{job.company[0]}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400">{job.company}</p>
              </div>
            </div>
            <h3 className="font-bold text-white text-sm leading-tight mt-2 group-hover:text-purple-300 transition-colors">{job.title}</h3>
          </div>

          {/* Match Score */}
          <div className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 ${scoreStyle.bg} ${scoreStyle.text} shadow-sm`}>
            <Zap className="w-3 h-3" />
            {job.matchScore}%
          </div>
        </div>

        {/* Match bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
            <span>Match Score</span>
            <span className={scoreStyle.text}>{job.matchScore >= 80 ? "Excellent" : job.matchScore >= 60 ? "Good" : "Fair"}</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${scoreStyle.bar} shadow-[0_0_6px_currentColor]`}
              style={{ width: `${job.matchScore}%` }}
            />
          </div>
        </div>

        {/* Metadata chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${typeStyle}`}>
            {job.type}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-white/5 text-gray-300 border border-white/10 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-purple-400" /> {job.location}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-white/5 text-gray-300 border border-white/10 flex items-center gap-1">
            <DollarSign className="w-2.5 h-2.5 text-emerald-400" /> {job.stipend}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-white/5 text-gray-300 border border-white/10 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-indigo-400" /> {job.duration}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">
          {job.description}
        </p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mb-4">
          {job.skills.slice(0, 4).map((skill) => (
            <span key={skill} className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-md font-medium">
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="text-[10px] px-2 py-0.5 bg-white/5 text-gray-400 rounded-md border border-white/10">
              +{job.skills.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-white/5">
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.35)] hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] cursor-pointer shimmer"
        >
          Apply Now <ExternalLink className="w-3 h-3" />
        </a>
        <button
          onClick={() => onSave(job)}
          className={`flex items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
            isSaved
              ? "bg-purple-500/15 text-purple-300 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
              : "bg-white/5 text-gray-400 border-white/10 hover:border-purple-500/30 hover:text-white hover:bg-white/10"
          }`}
          title={isSaved ? "Saved" : "Save job"}
        >
          {isSaved ? <BookmarkCheck className="w-4 h-4 text-purple-400" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
