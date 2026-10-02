import React from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { UserCircle2 } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";
import dynamic from "next/dynamic";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

// Dynamic import of ProfileForm to improve module loading performance
const ProfileForm = dynamic(() => import("@/components/profile/ProfileForm"), {
  loading: () => <LoadingSkeleton variant="form" />,
});

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const clerkUser = await currentUser();
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  const parsedSkills = dbUser?.skills ? JSON.parse(dbUser.skills) : [];

  const initialData = {
    name: dbUser?.name || clerkUser?.fullName || clerkUser?.firstName || "",
    targetRole: dbUser?.targetRole || null,
    skills: parsedSkills,
    githubUrl: dbUser?.githubUrl || null,
    linkedinUrl: dbUser?.linkedinUrl || null,
    bio: dbUser?.bio || null,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar — fixed on desktop, drawer on mobile */}
      <Sidebar />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="lg:pl-64 transition-all duration-300">
        <DashboardHeader />

        {/* Main Content */}
        <PageTransition>
          <main className="max-w-4xl mx-auto py-10 px-6 space-y-8">
            {/* Premium Header */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-7 text-white shadow-[0_8px_32px_rgba(139,92,246,0.15)] animate-fade-in">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-500/15 blur-3xl" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shrink-0">
                  <UserCircle2 className="w-8 h-8 text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.7)]" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
                    My Professional Profile
                  </h1>
                  <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                    Keep your details updated to customize your AI-powered career tools, portfolios, and mock interviews.
                  </p>
                </div>
              </div>
            </div>

            <ProfileForm initialData={initialData} />
          </main>
        </PageTransition>
      </div>
    </div>
  );
}
