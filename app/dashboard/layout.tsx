import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar — fixed rail on desktop, drawer on mobile */}
      <Sidebar />

      {/* Main content area — width offset comes from the sidebar spacer */}
      <div className="flex-1 min-w-0 transition-all duration-300">
        <DashboardHeader />
        <main className="p-6 lg:p-8 relative">
          <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(147,51,234,0.07),transparent_60%)]" />
          {children}
        </main>
      </div>
    </div>
  );
}
