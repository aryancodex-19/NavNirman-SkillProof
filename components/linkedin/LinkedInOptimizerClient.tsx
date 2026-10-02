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
  { id: "headline", label: "Headlines", icon: Link2, description: "Generate 5 AI headlines" },
  { id: "about", label: "About Section", icon: PenLine, description: "Rewrite your bio" },
  { id: "skills", label: "Skill Gaps", icon: Tag, description: "Get skill suggestions" },
];

export default function LinkedInOptimizerClient({ userRole, userSkills }: LinkedInOptimizerClientProps) {
  const [activeTab, setActiveTab] = useState("headline");

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-card border border-border rounded-2xl p-1.5 flex gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Description */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
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
