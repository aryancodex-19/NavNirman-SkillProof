"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  hoverEffect?: boolean;
  glowColor?: "indigo" | "violet" | "purple" | "pink" | "none";
}

function GlassCard({
  children,
  className = "",
  hoverEffect = true,
  glowColor = "purple",
  ...props
}: GlassCardProps) {
  const glowStyles = {
    purple: "hover:border-purple-500/40 hover:shadow-[0_8px_32px_rgba(168,85,247,0.2)]",
    violet: "hover:border-violet-500/40 hover:shadow-[0_8px_32px_rgba(139,92,246,0.2)]",
    indigo: "hover:border-indigo-500/40 hover:shadow-[0_8px_32px_rgba(99,102,241,0.2)]",
    pink: "hover:border-pink-500/40 hover:shadow-[0_8px_32px_rgba(236,72,153,0.2)]",
    none: "hover:border-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
  };

  return (
    <motion.div
      {...props}
      whileHover={hoverEffect ? { scale: 1.015, y: -2 } : undefined}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`
        relative overflow-hidden rounded-2xl border border-white/10
        bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_32px_rgba(139,92,246,0.12)]
        transition-all duration-300 ease-out group
        ${glowStyles[glowColor]}
        ${className}
      `}
    >
      {/* Top subtle highlight */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/30 to-transparent pointer-events-none" />

      {/* Ambient hover glow spot */}
      {hoverEffect && (
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-purple-500/[0.04] blur-2xl pointer-events-none group-hover:bg-purple-500/[0.08] transition-all duration-500" />
      )}

      {children}
    </motion.div>
  );
}

export default React.memo(GlassCard);
