"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

interface AnimatedButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "glass" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

function AnimatedButton({
  children,
  className = "",
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const baseStyles = "relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed select-none";
  
  const variants = {
    primary: "bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 border border-white/10",
    secondary: "bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 border border-white/10",
    glass: "bg-white/[0.04] border border-white/5 text-gray-200 hover:text-white hover:bg-white/[0.08] backdrop-blur-md",
    danger: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/10 border border-white/10",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-7 py-3.5 text-base gap-2.5",
  };

  return (
    <motion.button
      whileHover={!disabled && !isLoading ? { scale: 1.04, y: -1 } : undefined}
      whileTap={!disabled && !isLoading ? { scale: 0.96 } : undefined}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {/* Subtle overlay ripple shimmer */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:animate-shimmer pointer-events-none" />
      
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      
      <span>{children}</span>
    </motion.button>
  );
}

export default React.memo(AnimatedButton);
