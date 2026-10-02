"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";

interface KeywordListProps {
  matchedKeywords: string[];
  missingKeywords: string[];
}

export default function KeywordList({ matchedKeywords, missingKeywords }: KeywordListProps) {
  const hasMatched = matchedKeywords.length > 0;
  const hasMissing = missingKeywords.length > 0;

  return (
    <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_32px_rgba(139,92,246,0.12)] hover:border-purple-500/30 transition-all duration-300">
      <CardHeader className="border-b border-white/10 pb-4">
        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span>Keyword Match Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Matched Keywords */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Matched Skills & Keywords ({matchedKeywords.length})</span>
          </h4>
          {hasMatched ? (
            <div className="flex flex-wrap gap-2">
              {matchedKeywords.map((kw, idx) => (
                <Badge key={idx} variant="success">
                  {kw}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic pl-6">
              No matching keywords identified. Try updating your resume text.
            </p>
          )}
        </div>

        {/* Missing Keywords */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Missing Target Keywords ({missingKeywords.length})</span>
          </h4>
          {hasMissing ? (
            <div className="flex flex-wrap gap-2">
              {missingKeywords.map((kw, idx) => (
                <Badge key={idx} variant="destructive">
                  {kw}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-emerald-400 font-semibold italic pl-6 flex items-center gap-1">
              🎉 Perfect! No critical missing keywords found.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
