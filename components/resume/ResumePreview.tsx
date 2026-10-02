"use client";

import React from "react";
import { Printer, Eye } from "lucide-react";
import { type ResumeData } from "@/types";

interface ResumePreviewProps {
  data: ResumeData;
  title?: string;
}

export default function ResumePreview({ data, title = "Resume" }: ResumePreviewProps) {
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${(data.fullName || "Resume").replace(/\s+/g, "_")}_Resume`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header bar - Hidden when printing */}
      <div className="no-print flex items-center justify-between px-6 py-4 bg-zinc-950/40 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Live Preview</h3>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/15 transition-all hover:scale-[1.02]"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Export PDF / Print</span>
        </button>
      </div>

      {/* Printable CSS Page Styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything except the print-container */
          body * {
            visibility: hidden !important;
          }
          .print-container,
          .print-container * {
            visibility: visible !important;
          }
          .print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 2.5cm !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: white !important;
            color: #111111 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Scrollable preview area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-950/40">
        {/* Printable Resume Document Sheet */}
        <div className="print-container w-full max-w-[800px] mx-auto bg-white text-zinc-900 p-8 md:p-12 rounded-xl shadow-md transition-colors duration-300 min-h-[1050px] flex flex-col justify-between border border-zinc-200">
          <div className="space-y-6">
            {/* Header / Contact Info */}
            <div className="text-center pb-4 border-b border-zinc-300">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 uppercase">
                {data.fullName || "Your Full Name"}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-zinc-600 mt-2 font-semibold">
                {data.email && <span>{data.email}</span>}
                {data.email && data.phone && <span>•</span>}
                {data.phone && <span>{data.phone}</span>}
              </div>
            </div>

            {/* Summary */}
            {data.summary && (
              <div className="space-y-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-indigo-700 border-b border-zinc-300 pb-1">
                  Professional Summary
                </h2>
                <p className="text-xs leading-relaxed text-zinc-800 text-justify">
                  {data.summary}
                </p>
              </div>
            )}

            {/* Skills */}
            {data.skills && data.skills.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-indigo-700 border-b border-zinc-300 pb-1">
                  Skills & Expertise
                </h2>
                <div className="text-xs text-zinc-800 leading-relaxed font-semibold">
                  {data.skills.join(", ")}
                </div>
              </div>
            )}

            {/* Experience */}
            {data.experience && data.experience.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-indigo-700 border-b border-zinc-300 pb-1">
                  Work Experience
                </h2>
                <div className="space-y-4">
                  {data.experience.map((exp, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between font-bold text-xs text-zinc-900">
                        <h3>
                          {exp.role || "Role"} at <span className="text-indigo-700">{exp.company || "Company"}</span>
                        </h3>
                        <span className="text-zinc-500 font-semibold">
                          {exp.duration || "Dates"}
                        </span>
                      </div>
                      
                      {/* Achievements/Bullets */}
                      {exp.bullets && exp.bullets.length > 0 && (
                        <ul className="list-disc pl-5 space-y-1">
                          {exp.bullets.map((bullet, bulletIdx) => (
                            <li
                              key={bulletIdx}
                              className="text-xs leading-relaxed text-zinc-700"
                            >
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {data.education && data.education.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-indigo-700 border-b border-zinc-300 pb-1">
                  Education
                </h2>
                <div className="space-y-3">
                  {data.education.map((edu, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-start justify-between text-xs">
                      <div className="space-y-0.5">
                        <h3 className="font-bold text-zinc-900">
                          {edu.degree || "Degree"}
                        </h3>
                        <p className="text-zinc-700 font-semibold">
                          {edu.school || "School"}
                        </p>
                      </div>
                      <div className="text-right flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-0 font-semibold text-zinc-500">
                        <span>
                          {edu.year || "Year"}
                        </span>
                        {edu.gpa && (
                          <span className="text-[10px] text-zinc-700 font-bold bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 sm:mt-1">
                            GPA: {edu.gpa}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer brand indicator */}
          <div className="mt-8 pt-4 border-t border-zinc-200 text-center">
            <span className="text-[9px] text-zinc-400 font-semibold">
              Generated via CareerOS AI Resume Builder
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
