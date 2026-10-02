import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import dynamic from "next/dynamic";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import PageTransition from "@/components/ui/PageTransition";
import { ShieldCheck, FileText, GitGraph, Sparkles, CheckCircle2 } from "lucide-react";

const AssessmentClient = dynamic(
  () => import("@/components/assessment/AssessmentClient"),
  {
    loading: () => <LoadingSkeleton variant="dashboard" />,
  }
);

export const metadata = {
  title: "Evidence-Based Skill Assessment | CareerOS",
  description:
    "Evaluate resume-claimed skills backed by verified public GitHub repository evidence against target job roles.",
};

export default async function SkillAssessmentPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      resumes: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  const db = prisma as any;
  const gitHubRecord = dbUser
    ? await db.gitHubAnalysis.findUnique({
        where: { userId: dbUser.id },
      })
    : null;

  // Extract initial resume data
  let initialResume = null;
  if (dbUser?.resumes?.[0]) {
    const r = dbUser.resumes[0];
    let parsedSkills: string[] = [];
    try {
      if (r.skills) {
        parsedSkills = JSON.parse(r.skills);
      }
    } catch {
      parsedSkills = [];
    }
    initialResume = {
      id: r.id,
      title: r.title || "Latest Resume",
      skills: Array.isArray(parsedSkills) ? parsedSkills : [],
      fullName: r.fullName,
    };
  }

  // Extract initial GitHub username
  const initialGitHubUsername =
    gitHubRecord?.githubUsername ||
    (dbUser?.githubUrl
      ? dbUser.githubUrl.replace(/^https?:\/\/(www\.)?github\.com\/?/, "").replace(/\/$/, "")
      : "");

  // Target role
  const initialTargetRole = dbUser?.targetRole || "Full Stack Engineer";

  // Existing assessment
  const initialAssessment = gitHubRecord?.analysisData?.latestAssessment || null;

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-gray-950/60 via-indigo-950/30 to-violet-950/20 p-7 text-white shadow-2xl backdrop-blur-md">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-500/8 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shrink-0">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Feature 1 &bull; SkillProof Foundation
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Evidence-Based Skill Assessment
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm mt-1 leading-relaxed max-w-3xl">
                Correlate technical skills extracted from your resume against verifiable public GitHub
                artifacts (test suites, CI workflows, deployment configs, commits) for your target role.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap shrink-0">
              {[
                { icon: FileText, label: "Resume Claims" },
                { icon: GitGraph, label: "GitHub Code" },
                { icon: Sparkles, label: "Role Relevance" },
                { icon: CheckCircle2, label: "Verified Evidence" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-xs font-semibold text-gray-300"
                >
                  <Icon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Assessment Interactive Client */}
        <AssessmentClient
          initialResume={initialResume}
          initialGitHubUsername={initialGitHubUsername}
          initialTargetRole={initialTargetRole}
          initialAssessment={initialAssessment}
        />
      </div>
    </PageTransition>
  );
}
