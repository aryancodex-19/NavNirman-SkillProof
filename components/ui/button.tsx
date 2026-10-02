import * as React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "gradient";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", loading = false, children, disabled, ...props }, ref) => {
    let baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";
    let variantStyles = "";
    let sizeStyles = "";

    switch (variant) {
      case "default":
        variantStyles = "bg-primary text-primary-foreground shadow hover:bg-primary-hover";
        break;
      case "gradient":
        variantStyles =
          "bg-gradient-to-r from-primary to-purple-600 hover:from-primary-hover hover:to-purple-700 text-white shadow-md hover:shadow-primary/20";
        break;
      case "destructive":
        variantStyles = "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive-hover";
        break;
      case "outline":
        variantStyles =
          "border border-border bg-card shadow-sm hover:bg-card-hover text-foreground hover:border-primary/50";
        break;
      case "secondary":
        variantStyles = "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80";
        break;
      case "ghost":
        variantStyles = "hover:bg-accent hover:text-accent-foreground";
        break;
      case "link":
        variantStyles = "text-primary underline-offset-4 hover:underline";
        break;
    }

    switch (size) {
      case "default":
        sizeStyles = "h-10 px-5 py-2";
        break;
      case "sm":
        sizeStyles = "h-8 px-3 text-xs rounded-lg";
        break;
      case "lg":
        sizeStyles = "h-12 px-8 rounded-2xl";
        break;
      case "icon":
        sizeStyles = "h-9 w-9 p-0 rounded-lg";
        break;
    }

    return (
      <button
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
