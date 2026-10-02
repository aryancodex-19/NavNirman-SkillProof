"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

interface KeywordListProps {
  matchedKeywords: string[];
  missingKeywords: string[];
}

export default function KeywordList({ matchedKeywords, missingKeywords }: KeywordListProps) {
  const hasMatched = matchedKeywords.length > 0;
  const hasMissing = missingKeywords.length > 0;

  return (
    <Card className="border border-border bg-card shadow-lg hover:border-primary/20 transition-all duration-300">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          <span>Keyword Match Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Matched Keywords */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-success uppercase tracking-wider flex items-center gap-1.5">
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
            <p className="text-xs text-muted-foreground italic pl-6">
              No matching keywords identified. Try updating your resume text.
            </p>
          )}
        </div>

        {/* Missing Keywords */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          <h4 className="text-xs font-bold text-destructive uppercase tracking-wider flex items-center gap-1.5">
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
            <p className="text-xs text-success font-semibold italic pl-6 flex items-center gap-1">
              🎉 Perfect! No critical missing keywords found.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
