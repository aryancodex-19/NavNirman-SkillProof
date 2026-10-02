import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import dynamic from "next/dynamic";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

const VoiceChatUI = dynamic(() => import("@/components/interview/VoiceChatUI"), {
  loading: () => <LoadingSkeleton variant="card" />,
});
import { Mic, Brain, BarChart2, Trophy, Zap } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";

export const metadata = {
  title: "AI Voice Interview | CareerOS",
  description:
    "Experience a real AI-powered voice mock interview with adaptive questions, real-time evaluation, and detailed feedback.",
};

export default async function VoiceInterviewPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });

  const targetRole =
    dbUser?.targetRole ||
    clerkUser?.unsafeMetadata?.targetRole as string ||
    "Software Engineer";

  const skills = dbUser?.skills ? JSON.parse(dbUser.skills).join(", ") : "";

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-zinc-950/60 p-7 text-white shadow-2xl backdrop-blur-md animate-fade-in">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shrink-0">
              <Mic className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">AI Voice Mock Interview</h1>
              <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                Powered by Groq Llama 3.3 70B. Experience a voice mock interview with adaptive questions, real-time evaluation, and detailed feedback.
              </p>
              {targetRole && (
                <p className="text-gray-400 text-xs mt-2">
                  Practicing for: <span className="text-indigo-400 font-semibold">{targetRole}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap shrink-0">
              {[
                { icon: Brain, label: "Adaptive AI" },
                { icon: BarChart2, label: "Real-time Scores" },
                { icon: Trophy, label: "Final Report" },
                { icon: Zap, label: "Voice + Text" },
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

        {/* Interview Component */}
        <VoiceChatUI targetRole={targetRole} skills={skills} />
      </div>
    </PageTransition>
  );
}
