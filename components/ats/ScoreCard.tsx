"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScoreCardProps {
  score: number;
}

export default function ScoreCard({ score }: ScoreCardProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    setAnimatedScore(0);
    const duration = 1000;
    const steps = 60;
    const increment = score / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(increment * currentStep));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  // Dynamic colors and labels based on score
  let strokeColor = "text-red-400";
  let glowColor = "rgba(239, 68, 68, 0.4)";
  let label = "Needs Work";
  let badgeBg = "bg-red-500/10 border-red-500/20 text-red-300";

  if (score >= 80) {
    strokeColor = "text-purple-400";
    glowColor = "rgba(168, 85, 247, 0.5)";
    label = "Excellent Match";
    badgeBg = "bg-purple-500/10 border-purple-500/30 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.25)]";
  } else if (score >= 60) {
    strokeColor = "text-amber-400";
    glowColor = "rgba(245, 158, 11, 0.4)";
    label = "Good Match";
    badgeBg = "bg-amber-500/10 border-amber-500/20 text-amber-200";
  }

  const radius = 45;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/40">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg font-bold text-white">ATS Match Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
        {/* Circular SVG progress with glowing drop shadow */}
        <div
          className="relative w-44 h-44 flex items-center justify-center"
          style={{ filter: `drop-shadow(0 0 16px ${glowColor})` }}
        >
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="88"
              cy="88"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx="88"
              cy="88"
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`${strokeColor} transition-all duration-300 ease-out`}
              strokeLinecap="round"
            />
          </svg>
          {/* Inner Counter with gradient typography */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-black tracking-tight bg-gradient-to-b from-white via-white to-gray-300 bg-clip-text text-transparent">
              {animatedScore}%
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">
              Compatibility
            </span>
          </div>
        </div>

        {/* Text evaluation */}
        <div className="text-center space-y-2">
          <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold border ${badgeBg}`}>
            {label}
          </span>
          <p className="text-xs text-gray-400 max-w-sm leading-relaxed mx-auto">
            {score >= 80
              ? "Your resume has high alignment with the job description keywords and experience requirements."
              : score >= 60
              ? "Your resume matches well, but adding missing keywords can help pass automated filtering systems."
              : "Significant gap detected. Tailor your skills and description bullet points to match the target job requirements."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
