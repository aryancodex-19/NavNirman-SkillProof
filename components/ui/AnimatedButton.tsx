"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

interface AnimatedButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "glass" | "danger" | "purple";
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
  onClick,
  ...props
}: AnimatedButtonProps) {
  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    const rect = button.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - rect.left - radius}px`;
    circle.style.top = `${e.clientY - rect.top - radius}px`;
    circle.classList.add("ripple");
    const existing = button.getElementsByClassName("ripple")[0];
    if (existing) existing.remove();
    button.appendChild(circle);
    setTimeout(() => circle.remove(), 650);

    if (onClick) {
      onClick(e);
    }
  };

  const baseStyles =
    "relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 cursor-pointer overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97]";

  const variants = {
    primary:
      "bg-white text-black hover:bg-gray-100 shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] shimmer",
    purple:
      "bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:shadow-[0_0_40px_rgba(139,92,246,0.8)] shimmer",
    secondary:
      "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-purple-500/40 shadow-[0_4px_16px_rgba(0,0,0,0.3)]",
    glass:
      "bg-white/[0.04] border border-white/10 text-gray-200 hover:text-white hover:bg-white/[0.08] hover:border-purple-500/30 backdrop-blur-xl shadow-lg",
    danger:
      "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)]",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5 rounded-lg",
    md: "px-6 py-2.5 text-sm gap-2 rounded-xl",
    lg: "px-8 py-3.5 text-base gap-2.5 rounded-2xl",
  };

  return (
    <motion.button
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !isLoading ? { scale: 0.97 } : undefined}
      disabled={disabled || isLoading}
      onClick={handleRipple}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
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
