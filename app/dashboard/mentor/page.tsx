import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import dynamic from "next/dynamic";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

const MentorChat = dynamic(() => import("@/components/mentor/MentorChat"), {
  loading: () => <LoadingSkeleton variant="list" />,
});
import { BrainCircuit, Lightbulb, Map, BookOpen } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";

export const metadata = {
  title: "AI Career Mentor | CareerOS",
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
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-zinc-950/60 p-7 text-white shadow-2xl backdrop-blur-md animate-fade-in">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shrink-0">
              <BrainCircuit className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">AI Career Mentor</h1>
              <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                Personalized career guidance powered by Groq Llama 3.3 70B. Get roadmaps, course picks & expert advice.
              </p>
            </div>
            {/* Stat pills */}
            <div className="flex gap-2.5 flex-wrap shrink-0">
              {[
                { icon: Lightbulb, label: "Career Advice" },
                { icon: Map, label: "Roadmaps" },
                { icon: BookOpen, label: "Courses" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-xs font-semibold text-gray-300">
                  <Icon className="w-3.5 h-3.5 text-indigo-400" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Component */}
        <div className="glass-card border border-white/5 rounded-2xl overflow-hidden p-1 shadow-2xl bg-zinc-950/40">
          <MentorChat userProfile={userProfile} />
        </div>
      </div>
    </PageTransition>
  );
}
