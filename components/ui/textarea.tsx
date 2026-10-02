import * as React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        className={`flex min-h-[90px] w-full rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md px-4 py-3 text-sm shadow-[0_4px_16px_rgba(0,0,0,0.2)] placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-purple-500/60 focus-visible:ring-2 focus-visible:ring-purple-500/20 focus-visible:shadow-[0_0_20px_rgba(168,85,247,0.25)] disabled:cursor-not-allowed disabled:opacity-50 text-gray-100 transition-all duration-300 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
