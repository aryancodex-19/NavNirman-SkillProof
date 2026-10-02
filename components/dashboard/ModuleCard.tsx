"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Lock,
  ArrowRight,
  FileText,
  ScanSearch,
  BrainCircuit,
  Briefcase,
  Video,
  Code2,
  Share2,
  Layout,
  Mic,
  HelpCircle,
  GitGraph,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

// Static mapping of string names to Lucide icons to maintain perfect tree-shaking
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  FileText,
  ScanSearch,
  BrainCircuit,
  Briefcase,
  Video,
  Code2,
  Share2,
  Layout,
  Mic,
  GitGraph,
  ShieldCheck,
};

interface ModuleCardProps {
  title: string;
  description: string;
  iconName: string;
  status: "active" | "coming-soon";
  href?: string;
  badge?: string;
  index?: number;
}

function ModuleCard({
  title,
  description,
  iconName,
  status,
  href,
  badge,
  index = 0,
}: ModuleCardProps) {
  const isActive = status === "active";
  const Icon = ICON_MAP[iconName] || HelpCircle;

  const handleClick = useCallback(() => {
    if (!isActive) {
      toast.info(`${title} is coming soon!`, {
        description: "We're working hard to bring this module to you.",
      });
    }
  }, [isActive, title]);

  const cardContent = (
    <motion.div
      onClick={!isActive ? handleClick : undefined}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={isActive ? { scale: 1.02, y: -4 } : undefined}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      className={`
        group relative overflow-hidden rounded-2xl border p-6 h-full
        transition-all duration-300 ease-out
        ${
          isActive
            ? "bg-white/[0.03] backdrop-blur-xl border-white/10 hover:border-purple-500/40 hover:shadow-[0_8px_32px_rgba(139,92,246,0.2)] cursor-pointer"
            : "bg-white/[0.01] border-white/5 cursor-pointer opacity-70"
        }
      `}
    >
      {/* Top subtle border highlight */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/20 to-transparent pointer-events-none" />

      {/* Hover glow — active cards only */}
      {isActive && (
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl transition-all duration-500 group-hover:bg-purple-500/20" />
      )}

      <div className="relative z-10 flex flex-col h-full">
        {/* Icon */}
        <div
          className={`
          inline-flex items-center justify-center rounded-xl p-3 mb-4 w-fit
          transition-all duration-300
          ${
            isActive
              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:bg-purple-500/20 group-hover:border-purple-500/40 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              : "bg-white/5 text-gray-500"
          }
        `}
        >
          <Icon className="h-6 w-6" />
        </div>

        {/* Title */}
        <h3
          className={`text-lg font-bold tracking-tight mb-2 transition-colors duration-300 ${
            isActive
              ? "text-white group-hover:text-purple-300"
              : "text-gray-400"
          }`}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          className={`text-xs sm:text-sm leading-relaxed mb-5 flex-1 ${
            isActive ? "text-gray-300" : "text-gray-400"
          }`}
        >
          {description}
        </p>

        {/* Badge + Action */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {badge || "Active"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-gray-400 border border-white/10">
              <Lock className="h-3 w-3" />
              Coming Soon
            </span>
          )}

          {isActive && (
            <div className="flex items-center gap-1 text-xs font-bold text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>Launch</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (isActive && href) {
    return <Link href={href} className="block h-full">{cardContent}</Link>;
  }

  return cardContent;
}

export default React.memo(ModuleCard);
