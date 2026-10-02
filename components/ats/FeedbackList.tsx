"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, FileText, CheckCircle2, ChevronRight } from "lucide-react";

interface FeedbackListProps {
  feedback: string[];
  formattingIssues: string[];
}

export default function FeedbackList({ feedback, formattingIssues }: FeedbackListProps) {
  const hasFeedback = feedback.length > 0;
  const hasFormatting = formattingIssues.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Content Improvements */}
      <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_32px_rgba(139,92,246,0.12)] hover:border-purple-500/30 transition-all duration-300">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Content Suggestions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {hasFeedback ? (
            <ul className="space-y-4">
              {feedback.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-gray-300 group">
                  <span className="p-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 group-hover:scale-110 transition-transform shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-emerald-400 font-semibold italic flex items-center gap-1.5 pt-2">
              🎉 Your content structure looks highly optimized!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Formatting & Layout */}
      <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_32px_rgba(139,92,246,0.12)] hover:border-purple-500/30 transition-all duration-300">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Formatting & Layout Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {hasFormatting ? (
            <ul className="space-y-4">
              {formattingIssues.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-gray-300 group">
                  <span className="p-1 bg-white/5 border border-white/10 rounded-lg text-gray-300 group-hover:scale-110 transition-transform shrink-0">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-emerald-400 font-semibold italic flex items-center gap-1.5 pt-2">
              🎉 No formatting or layout errors detected.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
