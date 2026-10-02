import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

const ATSScanner = dynamic(() => import("@/components/ats/ATSScanner"), {
  loading: () => <LoadingSkeleton variant="form" />,
});
import { prisma } from "@/lib/db/prisma";
import { ShieldCheck, Activity } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";

export const metadata = {
  title: "AI ATS Scanner | SkillProof",
  description: "Scan your resume against any target job description using Groq Llama and get instant scores and tips.",
};

export default async function ATSPage() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  let initialResumeText = "";
  let resumeTitle = "";
  let hasResume = false;

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (user) {
      const latestResume = await prisma.resume.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      });

      if (latestResume) {
        hasResume = true;
        resumeTitle = latestResume.title || "Latest Resume";

        // Convert structured database JSON to clean plain text
        let skills: string[] = [];
        let experience: any[] = [];
        let education: any[] = [];

        try {
          skills = latestResume.skills ? JSON.parse(latestResume.skills) : [];
        } catch {
          skills = [];
        }

        try {
          experience = latestResume.experience ? JSON.parse(latestResume.experience) : [];
        } catch {
          experience = [];
        }

        try {
          education = latestResume.education ? JSON.parse(latestResume.education) : [];
        } catch {
          education = [];
        }

        const sections: string[] = [];

        // Header Info
        if (latestResume.fullName) {
          sections.push(latestResume.fullName.toUpperCase());
        }

        const contactParts: string[] = [];
        if (latestResume.email) contactParts.push(latestResume.email);
        if (latestResume.phone) contactParts.push(latestResume.phone);
        if (contactParts.length > 0) {
          sections.push(contactParts.join(" | "));
        }

        if (latestResume.targetRole) {
          sections.push(latestResume.targetRole);
        }

        // Summary Section
        if (latestResume.summary) {
          sections.push("");
          sections.push("PROFESSIONAL SUMMARY");
          sections.push(latestResume.summary);
        }

        // Skills Section
        if (skills.length > 0) {
          sections.push("");
          sections.push("SKILLS");
          sections.push(skills.join(", "));
        }

        // Experience Section
        if (experience.length > 0) {
          sections.push("");
          sections.push("WORK EXPERIENCE");
          for (const exp of experience) {
            sections.push("");
            sections.push(`${exp.role || "Role"} at ${exp.company || "Company"} (${exp.duration || ""})`);
            const bullets = exp.bullets || exp.achievements || [];
            if (Array.isArray(bullets)) {
              for (const bullet of bullets) {
                if (bullet) sections.push(`• ${bullet}`);
              }
            }
          }
        }

        // Education Section
        if (education.length > 0) {
          sections.push("");
          sections.push("EDUCATION");
          for (const edu of education) {
            const parts: string[] = [];
            if (edu.degree) parts.push(edu.degree);
            if (edu.school) parts.push(`from ${edu.school}`);
            if (edu.year) parts.push(`(${edu.year})`);
            if (edu.gpa) parts.push(`GPA: ${edu.gpa}`);
            sections.push(parts.join(" "));
          }
        }

        initialResumeText = sections.join("\n").trim();
      }
    }
  } catch (err) {
    console.error("Error loading resume server-side:", err);
  }

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/30 via-black/50 to-indigo-950/20 p-8 text-white shadow-[0_8px_32px_rgba(139,92,246,0.15)] backdrop-blur-xl animate-fade-in">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="p-4 bg-purple-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.25)] shrink-0">
              <Activity className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">
                ATS Compatibility Scanner
              </h1>
              <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                Paste the target job description and your resume text. AI will measure keyword overlap, layout structure, and score compatibility.
              </p>
            </div>
            <div className="flex gap-2.5 flex-wrap shrink-0">
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-xs font-semibold text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Verified Scanner</span>
              </div>
            </div>
          </div>
        </div>

        <ATSScanner 
          dbResumeText={initialResumeText} 
          dbResumeTitle={resumeTitle} 
          dbHasResume={hasResume}
        />
      </div>
    </PageTransition>
  );
}
