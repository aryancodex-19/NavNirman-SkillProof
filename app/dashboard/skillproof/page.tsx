import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import PageTransition from "@/components/ui/PageTransition";
import SkillProofDashboard from "@/components/skillproof/SkillProofDashboard";
import { ShieldCheck, GitBranch, Sparkles, Briefcase } from "lucide-react";

export const metadata = {
  title: "SkillProof | CareerOS",
  description: "Verify resume claims against public GitHub evidence and job readiness.",
};

export default async function SkillProofPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  const githubUsername = dbUser?.githubUrl
    ? dbUser.githubUrl
        .replace(/^https?:\/\/(www\.)?github\.com\/?/, "")
        .replace(/\/$/, "")
    : "";

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-slate-950 via-indigo-950/60 to-violet-950/40 p-7 text-white shadow-2xl backdrop-blur-md">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-500/8 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shrink-0">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200">
                <Sparkles className="w-3 h-3" />
                SkillProof
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
                Evidence-based skill verification
              </h1>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-2xl">
                Upload a resume, connect a GitHub profile, and check which skills are truly supported by code, activity, tests, README evidence, and job-fit analysis.
              </p>
            </div>

            <div className="flex gap-2 flex-wrap shrink-0">
              {[{ icon: GitBranch, label: "GitHub evidence" }, { icon: Briefcase, label: "Job fit" }].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-xs font-semibold text-slate-200">
                  <Icon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SkillProofDashboard
          candidateName={dbUser?.name || "Candidate"}
          defaultGithubUsername={githubUsername}
        />
      </div>
    </PageTransition>
  );
}
