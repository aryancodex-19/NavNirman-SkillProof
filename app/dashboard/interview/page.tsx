import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import dynamic from "next/dynamic";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

const InterviewChat = dynamic(() => import("@/components/interview/InterviewChat"), {
  loading: () => <LoadingSkeleton variant="list" />,
});
import { Video, Mic, BarChart2, Trophy } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";

export const metadata = {
  title: "AI Interview Coach | CareerOS",
  description: "Practice mock interviews with AI and get detailed real-time feedback on your answers.",
};

export default async function InterviewPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  const targetRole = dbUser?.targetRole || undefined;

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-zinc-950/60 p-7 text-white shadow-2xl backdrop-blur-md animate-fade-in">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shrink-0">
              <Video className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">AI Interview Coach</h1>
              <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                Practice with mock interview queries. Get scored on confidence, clarity, relevance & grammar.
              </p>
            </div>
            <div className="flex gap-2.5 flex-wrap shrink-0">
              {[
                { icon: Mic, label: "Voice Mode" },
                { icon: BarChart2, label: "Scored Feedback" },
                { icon: Trophy, label: "Track Progress" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-xs font-semibold text-gray-300">
                  <Icon className="w-3.5 h-3.5 text-indigo-400" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interview Coach Chat Panel */}
        <div className="glass-card border border-white/5 rounded-2xl overflow-hidden p-1 shadow-2xl bg-zinc-950/40">
          <InterviewChat defaultRole={targetRole} />
        </div>
      </div>
    </PageTransition>
  );
}
