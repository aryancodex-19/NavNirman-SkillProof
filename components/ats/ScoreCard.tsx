"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScoreCardProps {
  score: number;
}

export default function ScoreCard({ score }: ScoreCardProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Smooth counter animation on mount or score change
    setAnimatedScore(0);
    const duration = 1000; // 1s
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

  // Color logic
  let strokeColor = "text-destructive"; // Red
  let labelColor = "text-destructive";
  let label = "Needs Work";
  let bgColor = "bg-destructive/5 border-destructive/20";

  if (score >= 80) {
    strokeColor = "text-success"; // Green
    labelColor = "text-success";
    label = "Excellent";
    bgColor = "bg-success/5 border-success/20";
  } else if (score >= 60) {
    strokeColor = "text-amber-500"; // Yellow/Orange
    labelColor = "text-amber-500";
    label = "Good Match";
    bgColor = "bg-amber-500/5 border-amber-500/20";
  }

  const radius = 45;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <Card className={`border shadow-lg transition-all duration-500 hover:scale-[1.01] ${bgColor}`}>
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg font-bold text-foreground">ATS Match Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
        {/* Circular SVG progress */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-muted/20"
            />
            <circle
              cx="80"
              cy="80"
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
          {/* Inner Counter */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold text-foreground tracking-tight">
              {animatedScore}%
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
              Compatibility
            </span>
          </div>
        </div>

        {/* Text evaluation */}
        <div className="text-center space-y-1">
          <p className={`text-xl font-extrabold tracking-tight ${labelColor}`}>{label}</p>
          <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
            {score >= 80
              ? "Your resume has a very high alignment with the job description keywords and experience requirements."
              : score >= 60
              ? "Your resume matches well, but adding missing keywords can help pass automated filtering systems."
              : "Significant gap detected. Tailor your skills and description bullet points to match the target job requirements."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
