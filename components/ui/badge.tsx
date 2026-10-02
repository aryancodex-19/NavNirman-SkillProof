import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  let baseStyles =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  let variantStyles = "";

  switch (variant) {
    case "default":
      variantStyles = "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80";
      break;
    case "secondary":
      variantStyles = "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80";
      break;
    case "destructive":
      variantStyles =
        "border-transparent bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20";
      break;
    case "success":
      variantStyles = "border-transparent bg-success/10 text-success border-success/20 hover:bg-success/20";
      break;
    case "outline":
      variantStyles = "text-foreground border-border";
      break;
  }

  return <div className={`${baseStyles} ${variantStyles} ${className}`} {...props} />;
}
