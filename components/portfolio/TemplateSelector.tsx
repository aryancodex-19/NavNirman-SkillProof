"use client";

import React from "react";
import { CheckCircle } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  colors: string;
  accentText: string;
}

const TEMPLATES: Template[] = [
  {
    id: "modern",
    name: "Modern Dark",
    description: "Brittany Chiang-inspired split layout. Sticky nav, floating cards, and cursor-following glow meshes.",
    colors: "from-indigo-500 via-purple-600 to-pink-500",
    accentText: "text-indigo-400",
  },
  {
    id: "minimal",
    name: "Clean Minimal",
    description: "Lee Robinson-inspired minimalist dark layout. Spacious, elegant borders, and clean typography.",
    colors: "from-zinc-200 to-zinc-500",
    accentText: "text-zinc-300",
  },
  {
    id: "bold",
    name: "Bold Cyberpunk",
    description: "Vibrant neon grids. Thick glowing borders, cyber-themed typography, and high-impact layout details.",
    colors: "from-cyan-400 to-fuchsia-500",
    accentText: "text-cyan-400",
  },
];

interface TemplateSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

export default function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
          Choose Presentation Template
        </label>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Each template is fully responsive, optimized for loading speeds, and includes interactive features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TEMPLATES.map(template => {
          const isSelected = selected === template.id;
          return (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              type="button"
              className={`relative flex flex-col text-left rounded-2xl border-2 overflow-hidden transition-all duration-300 group cursor-pointer bg-zinc-950/45 ${
                isSelected
                  ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                  : "border-white/5 hover:border-white/15 hover:scale-[1.01]"
              }`}
            >
              {/* Mockup Preview Container */}
              <div className="h-28 w-full bg-zinc-950/90 relative p-3 overflow-hidden flex items-center justify-center border-b border-white/5">
                {/* 1. Modern Dark Split Mock */}
                {template.id === "modern" && (
                  <div className="w-full h-full flex gap-2 opacity-80">
                    <div className="w-1/3 h-full border-r border-white/10 flex flex-col gap-1.5 p-1">
                      <div className="h-2.5 w-6/7 bg-indigo-500/25 rounded" />
                      <div className="h-1.5 w-full bg-white/10 rounded" />
                      <div className="flex gap-1 mt-auto">
                        <div className="h-3 w-3 bg-white/20 rounded-full" />
                        <div className="h-3 w-3 bg-white/20 rounded-full" />
                      </div>
                    </div>
                    <div className="w-2/3 h-full flex flex-col gap-2 p-1 overflow-hidden">
                      <div className="h-1.5 w-2/3 bg-white/10 rounded" />
                      <div className="h-12 w-full bg-white/[0.03] border border-white/5 rounded-lg flex flex-col gap-1 p-1">
                        <div className="h-1.5 w-1/2 bg-indigo-500/20 rounded" />
                        <div className="h-1 w-full bg-white/5 rounded" />
                        <div className="h-1 w-4/5 bg-white/5 rounded" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Clean Minimal Mock */}
                {template.id === "minimal" && (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 opacity-80 max-w-[140px]">
                    <div className="h-2.5 w-20 bg-white/25 rounded-full" />
                    <div className="h-1.5 w-24 bg-white/10 rounded-full" />
                    <div className="w-full h-px bg-white/10 my-1" />
                    <div className="flex gap-2 w-full justify-between">
                      <div className="h-6 flex-1 bg-white/[0.02] border border-white/5 rounded flex flex-col justify-center p-0.5 gap-0.5">
                        <div className="h-1 w-2/3 bg-white/20 rounded" />
                        <div className="h-0.5 w-full bg-white/10 rounded" />
                      </div>
                      <div className="h-6 flex-1 bg-white/[0.02] border border-white/5 rounded flex flex-col justify-center p-0.5 gap-0.5">
                        <div className="h-1 w-2/3 bg-white/20 rounded" />
                        <div className="h-0.5 w-full bg-white/10 rounded" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Bold Cyberpunk Mock */}
                {template.id === "bold" && (
                  <div className="w-full h-full flex flex-col gap-2 p-1 opacity-80">
                    <div className="flex items-center justify-between border-b border-cyan-500/25 pb-1">
                      <div className="h-2.5 w-12 bg-cyan-500/30 rounded" />
                      <div className="h-2 w-2 rounded-full bg-fuchsia-500 animate-pulse" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-0.5">
                      <div className="h-9 border border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.05)] rounded p-1 flex flex-col gap-1 bg-[#040406]">
                        <div className="h-1.5 w-3/4 bg-fuchsia-500/30 rounded" />
                        <div className="h-1 w-full bg-white/10 rounded" />
                      </div>
                      <div className="h-9 border border-fuchsia-500/20 shadow-[0_0_8px_rgba(217,70,239,0.05)] rounded p-1 flex flex-col gap-1 bg-[#040406]">
                        <div className="h-1.5 w-3/4 bg-cyan-500/30 rounded" />
                        <div className="h-1 w-full bg-white/10 rounded" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Check overlay */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-primary rounded-full p-0.5 z-10 shadow-md">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                {/* Cyberpunk grid background lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
              </div>

              {/* Label & Description */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${template.colors}`} />
                    <p className="font-bold text-foreground text-xs">{template.name}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mt-1.5">
                    {template.description}
                  </p>
                </div>
                
                <span className={`text-[9px] font-bold mt-2.5 block ${template.accentText}`}>
                  Active Accents
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
