import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import dynamic from "next/dynamic";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import PageTransition from "@/components/ui/PageTransition";
import { TrendingUp, Target, Zap, FileSearch } from "lucide-react";

export const metadata = {
  title: "Job-Readiness Gap Report | SkillProof",
  description:
    "Paste a job description to get an evidence-linked gap analysis comparing your verified skills against job requirements, with actionable microtasks.",
};

const GapReportClient = dynamic(
  () => import("@/components/gap-report/GapReportClient"),
  { loading: () => <LoadingSkeleton variant="dashboard" /> }
);

export default async function GapReportPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });

  const db = prisma as any;
  const gitHubRecord = user
    ? await db.gitHubAnalysis.findUnique({ where: { userId: user.id } })
    : null;

  const initialGapReport = gitHubRecord?.analysisData?.latestGapReport || null;
  const latestAssessment = gitHubRecord?.analysisData?.latestAssessment || null;

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-gray-950/60 via-violet-950/30 to-fuchsia-950/20 p-7 text-white shadow-2xl backdrop-blur-md">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-fuchsia-500/8 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shrink-0">
              <TrendingUp className="w-8 h-8 text-violet-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Feature 3 &bull; SkillProof
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Job-Readiness Gap Report
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm mt-1 leading-relaxed max-w-3xl">
                Paste any job description to instantly see which required skills you have verified evidence for,
                which are gaps, and get actionable microtasks to close each gap.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap shrink-0">
              {[
                { icon: FileSearch, label: "JD Analysis" },
                { icon: Target, label: "Gap Matching" },
                { icon: Zap, label: "Microtasks" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-xs font-semibold text-gray-300"
                >
                  <Icon className="w-3.5 h-3.5 text-violet-400" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <GapReportClient
          initialGapReport={initialGapReport}
          hasAssessment={!!latestAssessment}
          targetRole={user?.targetRole || "Full Stack Engineer"}
        />
      </div>
    </PageTransition>
  );
}
