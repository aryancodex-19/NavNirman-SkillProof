"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, Filter, RefreshCw } from "lucide-react";
import JobCard from "./JobCard";
import { Button } from "@/components/ui/button";

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

interface InternshipFinderProps {
  userSkills?: string;
  userRole?: string;
}

const LOCATION_TYPES = ["Any", "Remote", "Hybrid", "Onsite"];
const ROLE_FILTERS = ["Any", "Frontend", "Backend", "Full Stack", "Data Science", "Machine Learning", "DevOps", "Mobile", "iOS", "Android"];

export default function InternshipFinder({ userSkills, userRole }: InternshipFinderProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [locationType, setLocationType] = useState("Any");
  const [roleFilter, setRoleFilter] = useState("Any");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"match" | "stipend">("match");

  const fetchSavedJobs = React.useCallback(async () => {
    try {
      const res = await fetch("/api/internships/search");
      if (!res.ok) throw new Error("Failed to fetch saved jobs");
      const data = await res.json();
      const ids = new Set<string>((data.savedJobs || []).map((j: any) => j.jobId));
      setSavedJobs(ids);
    } catch (err) {
      console.error("Failed to load saved jobs", err);
    }
  }, []);

  const fetchJobs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/internships/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: userSkills,
          role: userRole,
          locationType: locationType === "Any" ? undefined : locationType,
        }),
      });
      if (!res.ok) throw new Error("Failed to fetch internships");
      const data = await res.json();
      setJobs(data.internships || []);
    } catch (err: any) {
      toast.error("Failed to load internships", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [userSkills, userRole, locationType]);

  useEffect(() => {
    fetchJobs();
    fetchSavedJobs();
  }, [fetchJobs, fetchSavedJobs]);

  const handleSave = async (job: Job) => {
    const isCurrentlySaved = savedJobs.has(job.id);
    try {
      const res = await fetch("/api/internships/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          url: job.applyUrl,
          matchScore: job.matchScore,
          save: !isCurrentlySaved,
        }),
      });
      if (!res.ok) throw new Error("Failed to update wishlist");

      const newSaved = new Set(savedJobs);
      if (isCurrentlySaved) {
        newSaved.delete(job.id);
        toast.success("Removed from wishlist");
      } else {
        newSaved.add(job.id);
        toast.success("Saved to wishlist", { description: job.title + " at " + job.company });
      }
      setSavedJobs(newSaved);
    } catch (err: any) {
      toast.error("Failed to update wishlist", { description: err.message });
    }
  };

  const filteredJobs = jobs
    .filter(job => {
      if (locationType !== "Any" && job.type !== locationType) return false;
      if (roleFilter !== "Any" && !job.title.toLowerCase().includes(roleFilter.toLowerCase())) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.skills.some(s => s.toLowerCase().includes(q));
      }
      return true;
    })
    .sort((a, b) => sortBy === "match" ? b.matchScore - a.matchScore : 0);

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5 shadow-[0_8px_32px_rgba(139,92,246,0.12)]">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by role, company, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all"
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-semibold text-gray-300">Location:</span>
            <div className="flex gap-1.5">
              {LOCATION_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setLocationType(type)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    locationType === type
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                      : "bg-white/5 text-gray-400 border-white/10 hover:border-purple-500/30 hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Role filter */}
        <div className="flex flex-wrap gap-1.5">
          {ROLE_FILTERS.map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                roleFilter === role
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                  : "bg-white/5 text-gray-400 border-white/10 hover:border-purple-500/30 hover:text-white"
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Stats & Sort */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <p className="text-xs text-gray-400">
            Showing <span className="text-white font-bold">{filteredJobs.length}</span> internships
            {savedJobs.size > 0 && <span> · <span className="text-purple-400 font-bold">{savedJobs.size}</span> saved in wishlist</span>}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as "match" | "stipend")}
              className="text-xs bg-[#101018] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="match">Best Match</option>
              <option value="stipend">Stipend</option>
            </select>
            <button
              onClick={fetchJobs}
              disabled={loading}
              className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-purple-500/30 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white/[0.02] border border-white/10 rounded-2xl p-8">
          <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mb-4 text-purple-400">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-white text-base mb-2">No internships found</h3>
          <p className="text-xs text-gray-400 mb-4 max-w-sm">Try adjusting your filters or search query to see more open roles.</p>
          <Button variant="outline" onClick={() => { setSearchQuery(""); setLocationType("Any"); setRoleFilter("Any"); }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredJobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              isSaved={savedJobs.has(job.id)}
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
