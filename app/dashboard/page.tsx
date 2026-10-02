import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getOrCreateCurrentUser } from "@/lib/auth/syncUser";
import dynamic from "next/dynamic";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import RealStatsCards from "@/components/dashboard/RealStatsCards";
import PageTransition from "@/components/ui/PageTransition";
import GlassCard from "@/components/ui/GlassCard";
import { Clock, Sparkles } from "lucide-react";

const ModuleCard = dynamic(() => import("@/components/dashboard/ModuleCard"), {
  loading: () => <LoadingSkeleton variant="card" />,
});

const MODULES = [
  {
    title: "AI Resume Builder",
    description: "Build ATS-optimized resumes with AI-powered suggestions and real-time formatting.",
    status: "active" as const,
    iconName: "FileText",
    href: "/dashboard/resume",
  },
  {
    title: "ATS Scanner",
    description: "Scan your resume against job descriptions and get instant compatibility scores.",
    status: "active" as const,
    iconName: "ScanSearch",
    href: "/dashboard/ats",
  },
  {
    title: "AI Career Mentor",
    description: "Get personalized career guidance and roadmap recommendations from AI.",
    status: "active" as const,
    iconName: "BrainCircuit",
    href: "/dashboard/mentor",
  },
  {
    title: "Internship Finder",
    description: "Discover relevant internships matching your skills, location, and interests.",
    status: "active" as const,
    iconName: "Briefcase",
    href: "/dashboard/internships",
  },
  {
    title: "AI Interview Coach",
    description: "Practice mock interviews with AI and get detailed feedback on your answers.",
    status: "active" as const,
    iconName: "Video",
    href: "/dashboard/interview",
  },
  {
    title: "AI Voice Interview",
    description: "Real adaptive AI voice mock interviews with live scoring, follow-up questions, and performance reports.",
    status: "active" as const,
    iconName: "Mic",
    href: "/dashboard/interview-voice",
  },
  {
    title: "Coding Tracker",
    description: "Track your DSA progress across platforms and identify weak areas to improve.",
    status: "active" as const,
    iconName: "Code2",
    href: "/dashboard/coding",
  },
  {
    title: "LinkedIn Optimizer",
    description: "Optimize your LinkedIn profile for recruiter visibility and personal branding.",
    status: "active" as const,
    iconName: "Share2",
    href: "/dashboard/linkedin",
  },
  {
    title: "GitHub Deep Analysis",
    description: "Analyze your GitHub profile for coding activity, language diversity, project quality, and documentation.",
    status: "active" as const,
    iconName: "GitGraph",
    href: "/dashboard/github",
  },
];

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const dbUser = await getOrCreateCurrentUser();

  const db = prisma as any;

  const displayName = dbUser?.name || "Student";
  const targetRole = dbUser?.targetRole;

  // Real data calculations (fetched concurrently in a single round-trip batch)
  const [
    resumesCount,
    avgAtsAggregate,
    interviewSessionsCount,
    voiceInterviewsCount,
    mentorChatsCount,
    savedJobsCount,
    codingProgressList,
    gitHubAnalysisRecord,
  ] = dbUser
    ? await Promise.all([
        db.resume.count({ where: { userId: dbUser.id } }),
        db.aTSScan.aggregate({
          where: { userId: dbUser.id },
          _avg: { score: true },
        }),
        db.interviewSession.count({ where: { userId: dbUser.id } }),
        db.voiceInterview.count({ where: { userId: dbUser.id } }),
        db.mentorChat.count({ where: { userId: dbUser.id } }),
        db.savedJob.count({ where: { userId: dbUser.id } }),
        db.codingProgress.findMany({ where: { userId: dbUser.id } }),
        db.gitHubAnalysis.findUnique({ where: { userId: dbUser.id } }),
      ])
    : [0, null, 0, 0, 0, 0, [], null];

  const avgAtsScoreNum = avgAtsAggregate?._avg?.score;
  const avgAtsScore =
    avgAtsScoreNum !== null && avgAtsScoreNum !== undefined
      ? `${Math.round(avgAtsScoreNum)}%`
      : "—";

  const maxStreak =
    codingProgressList.length > 0
      ? Math.max(...codingProgressList.map((c: any) => c.streak))
      : 0;

  const githubScore = gitHubAnalysisRecord?.overallScore;

  // Get module badge based on real data
  const getModuleBadge = (title: string) => {
    if (title === "AI Resume Builder") return resumesCount > 0 ? `${resumesCount} Resumes` : "Get Started";
    if (title === "ATS Scanner") return avgAtsScore !== "—" ? `Avg: ${avgAtsScore}` : "Start Scanning";
    if (title === "AI Career Mentor") return mentorChatsCount > 0 ? `${mentorChatsCount} Chats` : "Start Chatting";
    if (title === "Internship Finder") return savedJobsCount > 0 ? `${savedJobsCount} Saved Jobs` : "Find Jobs";
    if (title === "AI Interview Coach") return interviewSessionsCount > 0 ? `${interviewSessionsCount} Sessions` : "Practice Mock";
    if (title === "AI Voice Interview") return voiceInterviewsCount > 0 ? `${voiceInterviewsCount} Voice Tests` : "Speak with AI";
    if (title === "Coding Tracker") return maxStreak > 0 ? `Streak: ${maxStreak}d` : "Track DSA";
    if (title === "LinkedIn Optimizer") return dbUser?.linkedinUrl ? "LinkedIn Linked" : "Not Linked";
    if (title === "GitHub Deep Analysis") return githubScore !== null && githubScore !== undefined ? `Score: ${githubScore}/100` : "Audit Profile";
    return undefined;
  };

  // Compile real activity feed
  const activities: Array<{
    type: string;
    title: string;
    description: string;
    timestamp: Date;
    glow: "purple" | "violet" | "indigo";
  }> = [];

  if (dbUser) {
    const [latestResumes, latestAtsScans, latestInterviews, latestVoiceInterviews, latestGitHub] = await Promise.all([
      db.resume.findMany({
        where: { userId: dbUser.id },
        orderBy: { updatedAt: "desc" },
        take: 3,
      }),
      db.aTSScan.findMany({
        where: { userId: dbUser.id },
        orderBy: { scannedAt: "desc" },
        take: 3,
      }),
      db.interviewSession.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      db.voiceInterview.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      db.gitHubAnalysis.findMany({
        where: { userId: dbUser.id },
        orderBy: { updatedAt: "desc" },
        take: 1,
      }),
    ]);

    latestResumes.forEach((r: any) => {
      activities.push({
        type: "Resume",
        title: `Modified: ${r.title}`,
        description: `Updated resume draft`,
        timestamp: r.updatedAt,
        glow: "purple",
      });
    });

    latestAtsScans.forEach((a: any) => {
      activities.push({
        type: "ATS Scan",
        title: `ATS Scan Executed`,
        description: `Compatibility score: ${a.score}%`,
        timestamp: a.scannedAt,
        glow: "violet",
      });
    });

    latestInterviews.forEach((i: any) => {
      activities.push({
        type: "Mock Interview",
        title: `Mock Interview complete`,
        description: `Role: ${i.role || "General"}`,
        timestamp: i.createdAt,
        glow: "indigo",
      });
    });

    latestVoiceInterviews.forEach((v: any) => {
      activities.push({
        type: "Voice Interview",
        title: `Voice Interview complete`,
        description: `Score: ${v.overallScore}% for ${v.targetRole}`,
        timestamp: v.createdAt,
        glow: "purple",
      });
    });

    latestGitHub.forEach((g: any) => {
      activities.push({
        type: "GitHub Analysis",
        title: `GitHub profile audit`,
        description: `Overall score: ${g.overallScore}/100`,
        timestamp: g.updatedAt,
        glow: "indigo",
      });
    });

    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  return (
    <PageTransition staggerChildren={true}>
      <div className="space-y-10 max-w-7xl mx-auto">
        
        {/* Welcome Section */}
        <WelcomeBanner displayName={displayName} targetRole={targetRole} />

        {/* Real Stats cards */}
        <RealStatsCards
          resumesCount={resumesCount}
          avgAtsScore={avgAtsScore}
          interviewSessionsCount={interviewSessionsCount + voiceInterviewsCount}
          maxStreak={maxStreak}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Module Cards Grid */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Workspace Hub</span>
                <Sparkles className="h-4 w-4 text-purple-400" />
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Access SkillProof AI instruments optimized to support your career progression.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {MODULES.map((module, index) => (
                <ModuleCard
                  key={module.title}
                  title={module.title}
                  description={module.description}
                  status={module.status}
                  iconName={module.iconName}
                  href={module.href}
                  badge={getModuleBadge(module.title)}
                  index={index}
                />
              ))}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Recent Activity</span>
                <Clock className="h-4 w-4 text-purple-400" />
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Audit history log of actions completed in SkillProof.
              </p>
            </div>

            <GlassCard hoverEffect={false} className="p-6 space-y-6 bg-white/[0.02] border-white/10 h-[560px] overflow-y-auto">
              {activities.length > 0 ? (
                <div className="relative border-l border-white/10 pl-4 ml-2 space-y-6">
                  {activities.slice(0, 7).map((activity, idx) => {
                    const glowColors = {
                      purple: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]",
                      violet: "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]",
                      indigo: "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]",
                    };
                    return (
                      <div key={idx} className="relative group">
                        {/* Dot indicator */}
                        <span className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${glowColors[activity.glow]} group-hover:scale-125 transition-transform`} />
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                            <span>&bull;</span>
                            <span className="font-bold text-purple-400">{activity.type}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white">
                            {activity.title}
                          </h4>
                          <p className="text-[11px] text-gray-400">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-20">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">No activity yet</h4>
                  <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
                    Start optimizing resumes or practicing interviews to see your logs appear here.
                  </p>
                </div>
              )}
            </GlassCard>
          </div>
        </div>

      </div>
    </PageTransition>
  );
}