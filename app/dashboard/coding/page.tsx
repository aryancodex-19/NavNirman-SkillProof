import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

const CodingTrackerClient = dynamic(() => import("@/components/coding/CodingTrackerClient"), {
  loading: () => <LoadingSkeleton variant="dashboard" />,
});
import { Code2, BookOpen, Target, Zap } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";

export const metadata = {
  title: "Coding Tracker | SkillProof",
  description: "Track your DSA progress, monitor streaks, and identify weak areas to focus your practice.",
};

export default async function CodingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/30 via-black/50 to-indigo-950/20 p-8 text-white shadow-[0_8px_32px_rgba(139,92,246,0.15)] backdrop-blur-xl animate-fade-in">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="p-4 bg-purple-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.25)] shrink-0">
              <Code2 className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">
                Coding Tracker
              </h1>
              <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                Track DSA progress across 12 key topics, monitor your streaks, and identify weak concepts to focus your practice.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap shrink-0">
              {[
                { icon: BookOpen, label: "12 DSA Topics" },
                { icon: Target, label: "Progress Mastery" },
                { icon: Zap, label: "Streak Tracking" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-xs font-semibold text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                >
                  <Icon className="w-3.5 h-3.5 text-purple-400" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tracker */}
        <CodingTrackerClient />
      </div>
    </PageTransition>
  );
}
