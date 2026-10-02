"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "gradient";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "default",
      size = "default",
      loading = false,
      children,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
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
      const existingRipple = button.getElementsByClassName("ripple")[0];
      if (existingRipple) existingRipple.remove();
      button.appendChild(circle);
      setTimeout(() => circle.remove(), 650);

      if (onClick) {
        onClick(e);
      }
    };

    const baseStyles =
      "relative inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] select-none cursor-pointer overflow-hidden";
    let variantStyles = "";
    let sizeStyles = "";

    switch (variant) {
      case "default":
        variantStyles =
          "bg-white text-black hover:bg-gray-100 hover:scale-[1.02] shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] shimmer";
        break;
      case "gradient":
        variantStyles =
          "bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:shadow-[0_0_40px_rgba(139,92,246,0.8)] hover:scale-[1.02] shimmer";
        break;
      case "destructive":
        variantStyles =
          "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:scale-[1.02]";
        break;
      case "outline":
        variantStyles =
          "border border-white/10 bg-white/[0.04] backdrop-blur-md text-white hover:bg-white/[0.1] hover:border-purple-500/40 hover:scale-[1.01] shadow-[0_4px_16px_rgba(0,0,0,0.3)]";
        break;
      case "secondary":
        variantStyles =
          "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-purple-500/40 hover:scale-[1.01]";
        break;
      case "ghost":
        variantStyles =
          "text-gray-300 hover:text-white hover:bg-white/[0.08] backdrop-blur-sm";
        break;
      case "link":
        variantStyles =
          "text-purple-400 underline-offset-4 hover:underline hover:text-purple-300 p-0 h-auto";
        break;
    }

    switch (size) {
      case "default":
        sizeStyles = "h-11 px-6 py-2.5 rounded-xl text-sm";
        break;
      case "sm":
        sizeStyles = "h-8 px-3.5 text-xs rounded-lg";
        break;
      case "lg":
        sizeStyles = "h-13 px-8 text-base rounded-2xl";
        break;
      case "icon":
        sizeStyles = "h-10 w-10 p-0 rounded-xl";
        break;
    }

    return (
      <button
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        ref={ref}
        disabled={disabled || loading}
        onClick={handleRipple}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
