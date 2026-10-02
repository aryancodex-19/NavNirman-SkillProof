"use client";

import React, { useState } from "react";
import HeadlineGenerator from "./HeadlineGenerator";
import AboutRewriter from "./AboutRewriter";
import SkillSuggestions from "./SkillSuggestions";
import { Link2, PenLine, Tag } from "lucide-react";

interface LinkedInOptimizerClientProps {
  userRole?: string;
  userSkills?: string;
}

const TABS = [
  { id: "headline", label: "Headlines", icon: Link2, description: "Generate 5 high-impact AI headlines targeted at hiring managers" },
  { id: "about", label: "About Section", icon: PenLine, description: "Rewrite your LinkedIn bio into an engaging, story-driven summary" },
  { id: "skills", label: "Skill Gaps", icon: Tag, description: "Discover high-frequency search keywords and skill suggestions" },
];

export default function LinkedInOptimizerClient({ userRole, userSkills }: LinkedInOptimizerClientProps) {
  const [activeTab, setActiveTab] = useState("headline");

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 flex gap-1.5 shadow-[0_8px_32px_rgba(139,92,246,0.1)]">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-purple-400" : "text-gray-400"}`} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Description */}
      <div className="text-center">
        <p className="text-xs text-gray-400 font-medium">
          {TABS.find(t => t.id === activeTab)?.description}
        </p>
      </div>

      {/* Content */}
      {activeTab === "headline" && <HeadlineGenerator userRole={userRole} userSkills={userSkills} />}
      {activeTab === "about" && <AboutRewriter userRole={userRole} userSkills={userSkills} />}
      {activeTab === "skills" && <SkillSuggestions userRole={userRole} userSkills={userSkills} />}
    </div>
  );
}
