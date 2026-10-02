"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  hoverEffect?: boolean;
  glowColor?: "indigo" | "violet" | "pink" | "none";
}

function GlassCard({
  children,
  className = "",
  hoverEffect = true,
  glowColor = "none",
  ...props
}: GlassCardProps) {
  const glowStyles = {
    indigo: "hover:shadow-indigo-500/5 hover:border-indigo-500/20",
    violet: "hover:shadow-violet-500/5 hover:border-violet-500/20",
    pink: "hover:shadow-pink-500/5 hover:border-pink-500/20",
    none: "hover:border-white/10 hover:shadow-black/40",
  };

  return (
    <motion.div
      {...props}
      whileHover={hoverEffect ? { scale: 1.02, y: -2 } : undefined}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`
        relative overflow-hidden rounded-2xl border border-white/5 
        bg-white/[0.03] backdrop-blur-xl shadow-lg 
        transition-all duration-300 ease-out
        ${glowStyles[glowColor]}
        ${className}
      `}
    >
      {/* Subtle top light highlight border */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      
      {/* Ambient hover glow spot if hoverEffect is on */}
      {hoverEffect && (
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/[0.01] blur-2xl pointer-events-none group-hover:bg-white/[0.03] transition-all duration-500" />
      )}
      
      {children}
    </motion.div>
  );
}

export default React.memo(GlassCard);
