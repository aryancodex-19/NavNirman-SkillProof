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
      <Card className="border border-border bg-card shadow-lg hover:border-primary/20 transition-all duration-300">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>AI Content Suggestions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {hasFeedback ? (
            <ul className="space-y-4">
              {feedback.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground group">
                  <span className="p-1 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-success font-semibold italic flex items-center gap-1.5 pt-2">
              🎉 Your content structure looks highly optimized!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Formatting & Layout */}
      <Card className="border border-border bg-card shadow-lg hover:border-primary/20 transition-all duration-300">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>Formatting & Layout Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {hasFormatting ? (
            <ul className="space-y-4">
              {formattingIssues.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground group">
                  <span className="p-1 bg-secondary rounded-lg text-foreground group-hover:scale-110 transition-transform shrink-0">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-success font-semibold italic flex items-center gap-1.5 pt-2">
              🎉 No formatting or layout errors detected.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
