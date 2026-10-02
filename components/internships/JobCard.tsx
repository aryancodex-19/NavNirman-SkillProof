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
  if (score >= 80) return { text: "text-success", bg: "bg-success/10 border-success/20", bar: "bg-success" };
  if (score >= 60) return { text: "text-warning", bg: "bg-warning/10 border-warning/20", bar: "bg-warning" };
  return { text: "text-danger", bg: "bg-danger/10 border-danger/20", bar: "bg-danger" };
}

function getTypeColor(type: string) {
  if (type === "Remote") return "bg-success/10 text-success border-success/20";
  if (type === "Hybrid") return "bg-warning/10 text-warning border-warning/20";
  return "bg-primary/10 text-primary border-primary/20";
}

export default function JobCard({ job, isSaved, onSave }: JobCardProps) {
  const scoreStyle = getScoreColor(job.matchScore);
  const typeStyle = getTypeColor(job.type);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{job.company[0]}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{job.company}</p>
            </div>
          </div>
          <h3 className="font-bold text-foreground text-sm leading-tight mt-2">{job.title}</h3>
        </div>

        {/* Match Score */}
        <div className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 ${scoreStyle.bg} ${scoreStyle.text}`}>
          <Zap className="w-3 h-3" />
          {job.matchScore}%
        </div>
      </div>

      {/* Match bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>Match Score</span>
          <span className={scoreStyle.text}>{job.matchScore >= 80 ? "Excellent" : job.matchScore >= 60 ? "Good" : "Fair"}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${scoreStyle.bar}`}
            style={{ width: `${job.matchScore}%` }}
          />
        </div>
      </div>

      {/* Metadata chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${typeStyle}`}>
          {job.type}
        </span>
        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-muted text-muted-foreground border border-border flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5" /> {job.location}
        </span>
        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-muted text-muted-foreground border border-border flex items-center gap-1">
          <DollarSign className="w-2.5 h-2.5" /> {job.stipend}
        </span>
        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-muted text-muted-foreground border border-border flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" /> {job.duration}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
        {job.description}
      </p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1 mb-4">
        {job.skills.slice(0, 4).map((skill) => (
          <span key={skill} className="text-[10px] px-2 py-0.5 bg-primary/5 text-primary border border-primary/10 rounded-md font-medium">
            {skill}
          </span>
        ))}
        {job.skills.length > 4 && (
          <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-md">
            +{job.skills.length - 4}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors"
        >
          Apply Now <ExternalLink className="w-3 h-3" />
        </a>
        <button
          onClick={() => onSave(job)}
          className={`flex items-center justify-center p-2 rounded-xl border transition-all ${
            isSaved
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-muted text-muted-foreground border-border hover:border-primary/20 hover:text-primary"
          }`}
          title={isSaved ? "Saved" : "Save job"}
        >
          {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
