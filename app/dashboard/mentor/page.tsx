import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import dynamic from "next/dynamic";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { BrainCircuit, Lightbulb, Map, BookOpen, Sparkles } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";

const MentorChat = dynamic(() => import("@/components/mentor/MentorChat"), {
  loading: () => <LoadingSkeleton variant="list" />,
});

export const metadata = {
  title: "AI Career Mentor | SkillProof",
  description: "Get personalized career guidance from your AI mentor powered by Groq Llama 3.3 70B.",
};

export default async function MentorPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });

  const userProfile = {
    name: dbUser?.name || clerkUser?.firstName || undefined,
    targetRole: dbUser?.targetRole || undefined,
    skills: dbUser?.skills ? JSON.parse(dbUser.skills).join(", ") : undefined,
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-7 text-white shadow-[0_8px_32px_rgba(139,92,246,0.15)] backdrop-blur-xl">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
            <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(139,92,246,0.2)] shrink-0">
              <BrainCircuit className="w-8 h-8 text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Adaptive Career Strategist
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-300">
                AI Career Mentor
              </h1>
              <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                Personalized career guidance powered by Groq Llama 3.3 70B. Get custom roadmaps, curriculum picks & expert industry advice.
              </p>
            </div>
            {/* Stat pills */}
            <div className="flex gap-2.5 flex-wrap shrink-0">
              {[
                { icon: Lightbulb, label: "Career Advice" },
                { icon: Map, label: "Roadmaps" },
                { icon: BookOpen, label: "Courses" },
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

        {/* Chat Component */}
        <div className="rounded-2xl overflow-hidden p-1 shadow-[0_8px_32px_rgba(139,92,246,0.12)]">
          <MentorChat userProfile={userProfile} />
        </div>
      </div>
    </PageTransition>
  );
}
