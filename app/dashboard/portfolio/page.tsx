import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import dynamic from "next/dynamic";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { Layout, Sparkles, Download, Globe } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";

const PortfolioGeneratorClient = dynamic(() => import("@/components/portfolio/PortfolioGeneratorClient"), {
  loading: () => <LoadingSkeleton variant="dashboard" />,
});

export const metadata = {
  title: "Portfolio Generator | SkillProof",
  description: "Generate a stunning personal portfolio website from your resume data in seconds.",
};

export default async function PortfolioPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });

  // Fetch most recent resume to pre-populate form elements
  const latestResume = dbUser
    ? await prisma.resume.findFirst({
        where: { userId: dbUser.id },
        orderBy: { updatedAt: "desc" },
      })
    : null;

  const userResume = latestResume
    ? {
        fullName: latestResume.fullName || undefined,
        email: latestResume.email || undefined,
        summary: latestResume.summary || undefined,
        skills: latestResume.skills || undefined,
        experience: latestResume.experience || undefined,
        education: latestResume.education || undefined,
        targetRole: latestResume.targetRole || undefined,
      }
    : undefined;

  const userProfile = dbUser
    ? {
        name: dbUser.name,
        githubUrl: dbUser.githubUrl || undefined,
        linkedinUrl: dbUser.linkedinUrl || undefined,
      }
    : undefined;

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-7 text-white shadow-[0_8px_32px_rgba(139,92,246,0.15)] backdrop-blur-xl">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(139,92,246,0.2)] shrink-0">
              <Layout className="w-8 h-8 text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                AI Web Engine
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-300">
                Portfolio Generator
              </h1>
              <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                Generate a stunning, responsive personal portfolio website from your resume data instantly using AI.
              </p>
            </div>
            <div className="flex gap-2.5 flex-wrap shrink-0">
              {[
                { icon: Sparkles, label: "AI Generated" },
                { icon: Globe, label: "3 Templates" },
                { icon: Download, label: "Download HTML" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.04] backdrop-blur-md rounded-xl border border-white/10 text-xs font-semibold text-gray-300 hover:border-purple-500/30 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-purple-400" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Generator Client Workspace */}
        <PortfolioGeneratorClient userResume={userResume} userProfile={userProfile} />
      </div>
    </PageTransition>
  );
}
