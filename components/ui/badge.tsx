import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "purple";
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50";
  let variantStyles = "";

  switch (variant) {
    case "default":
      variantStyles =
        "border border-purple-500/30 bg-purple-500/10 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]";
      break;
    case "purple":
      variantStyles =
        "border border-purple-400/40 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.25)]";
      break;
    case "secondary":
      variantStyles =
        "border border-white/10 bg-white/5 backdrop-blur-md text-gray-300 hover:bg-white/10";
      break;
    case "destructive":
      variantStyles =
        "border border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]";
      break;
    case "success":
      variantStyles =
        "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]";
      break;
    case "outline":
      variantStyles = "text-gray-300 border border-white/15 bg-transparent";
      break;
  }

  return <div className={`${baseStyles} ${variantStyles} ${className}`} {...props} />;
}
