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
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      className={`
        group relative overflow-hidden rounded-2xl border p-6 h-full
        transition-all duration-300 ease-out
        ${
          isActive
            ? "bg-card border-border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 cursor-pointer"
            : "bg-card/50 border-border/50 cursor-pointer hover:bg-card/80"
        }
      `}
    >
      {/* Hover glow — active cards only */}
      {isActive && (
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/5 blur-2xl transition-all duration-500 group-hover:bg-primary/10 group-hover:h-36 group-hover:w-36" />
      )}

      <div className="relative z-10 flex flex-col h-full">
        {/* Icon */}
        <div
          className={`
          inline-flex items-center justify-center rounded-xl p-3 mb-4 w-fit
          transition-all duration-300
          ${
            isActive
              ? "bg-primary/10 text-primary group-hover:bg-primary/15 group-hover:scale-110"
              : "bg-muted text-muted-foreground"
          }
        `}
        >
          <Icon className="h-6 w-6" />
        </div>

        {/* Title */}
        <h3
          className={`text-lg font-bold tracking-tight mb-2 transition-colors duration-300 ${
            isActive
              ? "text-card-foreground group-hover:text-primary"
              : "text-muted-foreground"
          }`}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          className={`text-sm leading-relaxed mb-5 flex-1 ${
            isActive ? "text-muted-foreground" : "text-muted-foreground/60"
          }`}
        >
          {description}
        </p>

        {/* Badge + Action */}
        <div className="flex items-center justify-between">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success border border-success/20">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              {badge || "Active"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Lock className="h-3 w-3" />
              Coming Soon
            </span>
          )}

          {isActive && (
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
          )}
        </div>
      </div>
    </motion.div>
  );

  if (isActive && href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}

export default React.memo(ModuleCard);
