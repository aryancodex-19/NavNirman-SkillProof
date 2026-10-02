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
    <div className="min-h-screen bg-background">
      {/* Sidebar — fixed on desktop, drawer on mobile */}
      <Sidebar />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="lg:pl-64 transition-all duration-300">
        <DashboardHeader />
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
