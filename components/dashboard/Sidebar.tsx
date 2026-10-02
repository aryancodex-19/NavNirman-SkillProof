"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Menu,
  ChevronRight,
  Mic,
  FileText,
  ScanSearch,
  BrainCircuit,
  Briefcase,
  Video,
  Code2,
  Share2,
  Layout,
  GitGraph,
  ShieldCheck,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import {
  AnimatedSidebar,
  AnimatedSidebarProvider,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
} from "@/components/ui/AnimatedSidebar";
import SpinningLogo from "@/components/ui/SpinningLogo";

const NAV_GROUPS: { name: string; items: { label: string; href: string; icon: LucideIcon }[] }[] = [
  {
    name: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Skill Assessment", href: "/dashboard/assessment", icon: ShieldCheck },
      { label: "AI Resume Builder", href: "/dashboard/resume", icon: FileText },
      { label: "ATS Scanner", href: "/dashboard/ats", icon: ScanSearch },
      { label: "Portfolio Generator", href: "/dashboard/portfolio", icon: Layout },
      { label: "LinkedIn Optimizer", href: "/dashboard/linkedin", icon: Share2 },
      { label: "GitHub Analysis", href: "/dashboard/github", icon: GitGraph },
      { label: "SkillProof", href: "/dashboard/skillproof", icon: Sparkles },
    ]
  },
  {
    name: "Practice & Search",
    items: [
      { label: "AI Voice Interview", href: "/dashboard/interview-voice", icon: Mic },
      { label: "AI Interview Coach", href: "/dashboard/interview", icon: Video },
      { label: "AI Career Mentor", href: "/dashboard/mentor", icon: BrainCircuit },
      { label: "Coding Tracker", href: "/dashboard/coding", icon: Code2 },
      { label: "Internship Finder", href: "/dashboard/internships", icon: Briefcase },
    ],
  },
  {
    name: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: User },
    ],
  },
];

function SidebarNav() {
  const pathname = usePathname();
  const { isCollapsed, setMobileOpen } = useSidebar();

  return (
    <SidebarContent className={isCollapsed ? "px-2 space-y-5" : "px-3 space-y-6"}>
      {NAV_GROUPS.map((group) => (
        <SidebarGroup
          key={group.name}
          className={isCollapsed ? "space-y-1.5" : undefined}
        >
          <SidebarGroupLabel>{group.name}</SidebarGroupLabel>
          {group.items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <SidebarMenuButton
                key={item.href}
                href={item.href}
                isActive={isActive}
                tooltip={item.label}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                      : "text-gray-400 group-hover:text-white"
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {isActive && !isCollapsed && (
                  <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-purple-400" />
                )}
              </SidebarMenuButton>
            );
          })}
        </SidebarGroup>
      ))}
    </SidebarContent>
  );
}

function SidebarLogo() {
  return (
    <Link
      href="/dashboard"
      aria-label="SkillProof home"
      className="flex shrink-0 items-center justify-center"
    >
      <SpinningLogo size={32} />
    </Link>
  );
}

function SidebarBrand() {
  const { isCollapsed } = useSidebar();

  return (
    <div
      className={`flex items-center h-16 border-b border-white/10 shrink-0 ${
        isCollapsed ? "justify-center px-2" : "gap-3 px-5"
      }`}
    >
      <SidebarLogo />

      {!isCollapsed && (
        <span className="text-lg font-extrabold tracking-tight text-white truncate">
          Skill
          <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Proof
          </span>
        </span>
      )}

      <SidebarTrigger className={isCollapsed ? "w-full mt-2" : "ml-auto"}>
        {isCollapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </SidebarTrigger>
    </div>
  );
}

function SidebarShell() {
  return (
    <>
      {/* Mobile hamburger */}
      <SidebarTrigger className="fixed top-3.5 left-4 z-50 md:hidden">
        <Menu className="h-5 w-5" />
      </SidebarTrigger>

      <AnimatedSidebar>
        <SidebarBrand />
        <SidebarNav />
      </AnimatedSidebar>
    </>
  );
}

function Sidebar() {
  return (
    <AnimatedSidebarProvider>
      <SidebarShell />
    </AnimatedSidebarProvider>
  );
}

export { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED };
export default React.memo(Sidebar);
