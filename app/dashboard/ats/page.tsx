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
  title: "AI ATS Scanner | CareerOS",
  description: "Scan your resume against any target job description using Groq Llama 4 and get instant scores and tips.",
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
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-zinc-950/60 p-7 text-white shadow-2xl backdrop-blur-md animate-fade-in">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shrink-0">
              <Activity className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">ATS Compatibility Scanner</h1>
              <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                Paste the target job description and your resume plain text. AI will measure keyword overlap and layout structure.
              </p>
            </div>
            <div className="flex gap-2.5 flex-wrap shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-xs font-semibold text-gray-300">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Groq Llama Scanner</span>
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
