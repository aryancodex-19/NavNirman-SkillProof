import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import dynamic from "next/dynamic";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

const GitHubAnalysisClient = dynamic(() => import("@/components/github/GitHubAnalysisClient"), {
  loading: () => <LoadingSkeleton variant="dashboard" />,
});
import { GitGraph, Sparkles, GitBranch, BarChart3, FileText } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";

export const metadata = {
  title: "GitHub Deep Analysis | CareerOS",
  description:
    "Analyze your GitHub profile for activity, language diversity, project complexity, and documentation quality.",
};

export default async function GitHubPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });

  // Check if user has existing GitHub analysis
  const db = prisma as any;
  let existingAnalysis = null;
  if (dbUser) {
    const record = await db.gitHubAnalysis.findUnique({
      where: { userId: dbUser.id },
    });
    if (record) {
      existingAnalysis = {
        username: record.githubUsername,
        overallScore: record.overallScore,
        analyzedAt: record.analyzedAt?.toISOString() || null,
        hasToken: !!record.githubToken,
        data: record.analysisData || null,
      };
    }
  }

  // Try to prefill GitHub username from the profile
  const defaultUsername = dbUser?.githubUrl
    ? dbUser.githubUrl
        .replace(/^https?:\/\/(www\.)?github\.com\/?/, "")
        .replace(/\/$/, "")
    : "";

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-gray-950/60 via-indigo-950/30 to-violet-950/20 p-7 text-white shadow-2xl backdrop-blur-md animate-fade-in">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-500/8 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shrink-0">
              <GitGraph className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                GitHub Deep Analysis
              </h1>
              <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                Analyze your GitHub profile to uncover coding patterns, language
                expertise, project quality, and actionable recommendations.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap shrink-0">
              {[
                { icon: GitBranch, label: "Activity" },
                { icon: BarChart3, label: "Languages" },
                { icon: Sparkles, label: "Projects" },
                { icon: FileText, label: "Docs Quality" },
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

        {/* Client Component */}
        <GitHubAnalysisClient
          existingAnalysis={existingAnalysis}
          defaultUsername={defaultUsername}
        />
      </div>
    </PageTransition>
  );
}
