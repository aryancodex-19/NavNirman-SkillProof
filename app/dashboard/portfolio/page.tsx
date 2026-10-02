import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import dynamic from "next/dynamic";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

const PortfolioGeneratorClient = dynamic(() => import("@/components/portfolio/PortfolioGeneratorClient"), {
  loading: () => <LoadingSkeleton variant="dashboard" />,
});
import { Layout, Sparkles, Download, Globe } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";

export const metadata = {
  title: "Portfolio Generator | CareerOS",
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
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-zinc-950/60 p-7 text-white shadow-2xl backdrop-blur-md animate-fade-in">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shrink-0">
              <Layout className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Portfolio Generator</h1>
              <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                Generate a stunning, responsive personal portfolio website from your resume data instantly using AI.
              </p>
            </div>
            <div className="flex gap-2.5 flex-wrap shrink-0">
              {[
                { icon: Sparkles, label: "AI Generated" },
                { icon: Globe, label: "3 Templates" },
                { icon: Download, label: "Download HTML" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-xs font-semibold text-gray-300">
                  <Icon className="w-3.5 h-3.5 text-indigo-400" />
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
