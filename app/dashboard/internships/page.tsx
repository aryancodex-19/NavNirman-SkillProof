import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import dynamic from "next/dynamic";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

const InternshipFinder = dynamic(() => import("@/components/internships/InternshipFinder"), {
  loading: () => <LoadingSkeleton variant="dashboard" />,
});
import { Briefcase, Zap, MapPin, DollarSign } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";

export const metadata = {
  title: "Internship Finder | CareerOS",
  description: "Discover AI-matched internships that align with your skills and career goals.",
};

export default async function InternshipsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });

  const userSkills = dbUser?.skills ? JSON.parse(dbUser.skills).join(", ") : undefined;
  const userRole = dbUser?.targetRole || undefined;

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-zinc-950/60 p-7 text-white shadow-2xl backdrop-blur-md animate-fade-in">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shrink-0">
              <Briefcase className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Internship Finder</h1>
              <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                AI-scored internships ranked dynamically by how well they match your skills and target role.
              </p>
              {userRole && (
                <p className="text-gray-400 text-xs mt-2">
                  Matching for: <span className="text-indigo-400 font-semibold">{userRole}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap shrink-0">
              {[
                { icon: Zap, label: "AI Matched" },
                { icon: MapPin, label: "India & Remote" },
                { icon: DollarSign, label: "With Stipend" },
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

        {/* Internship Finder */}
        <InternshipFinder userSkills={userSkills} userRole={userRole} />
      </div>
    </PageTransition>
  );
}
