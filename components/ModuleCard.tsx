import React from "react";
import * as Icons from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  status: "active" | "coming-soon";
  iconName: keyof typeof Icons | "Linkedin";
  href?: string;
}

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function ModuleCard({
  title,
  description,
  status,
  iconName,
  href,
}: ModuleCardProps) {
  const isActive = status === "active";

  const CardWrapper = isActive && href ? "a" : "div";

  const renderIcon = () => {
    if (iconName === "Linkedin") {
      return <LinkedinIcon className="h-6 w-6" />;
    }
    const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
    if (IconComponent) {
      return <IconComponent className="h-6 w-6" />;
    }
    return <Icons.HelpCircle className="h-6 w-6" />;
  };

  return (
    <CardWrapper
      href={isActive ? href : undefined}
      className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 ${
        isActive
          ? "border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_32px_rgba(139,92,246,0.12)] hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-[0_8px_32px_rgba(139,92,246,0.25)] cursor-pointer group text-white"
          : "border-white/5 bg-white/[0.01] opacity-60 text-gray-400"
      }`}
    >
      {/* Background soft glow for active cards */}
      {isActive && (
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-purple-500/10 blur-2xl transition-all duration-300 group-hover:bg-purple-500/20" />
      )}

      <div className="flex flex-col h-full justify-between">
        <div>
          {/* Icon */}
          <div
            className={`inline-flex items-center justify-center rounded-xl p-3 mb-4 ${
              isActive
                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform"
                : "bg-white/5 text-gray-500"
            }`}
          >
            {renderIcon()}
          </div>

          {/* Title */}
          <h3
            className={`text-lg font-bold tracking-tight mb-2 ${
              isActive
                ? "text-white group-hover:text-purple-300 transition-colors"
                : "text-gray-400"
            }`}
          >
            {title}
          </h3>

          {/* Description */}
          <p
            className={`text-sm leading-relaxed mb-6 ${
              isActive
                ? "text-gray-300"
                : "text-gray-400"
            }`}
          >
            {description}
          </p>
        </div>

        {/* Badge status */}
        <div className="flex items-center">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-gray-400 border border-white/10">
              Coming Soon
            </span>
          )}
        </div>
      </div>
    </CardWrapper>
  );
}
