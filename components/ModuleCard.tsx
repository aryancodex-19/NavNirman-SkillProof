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
          ? "border-neutral-200 bg-white shadow-sm hover:-translate-y-1 hover:border-blue-400 hover:shadow-md hover:shadow-blue-50/50 cursor-pointer group dark:border-neutral-850 dark:bg-neutral-900 dark:hover:border-blue-500"
          : "border-neutral-100 bg-neutral-50/50 opacity-70 dark:border-neutral-850 dark:bg-neutral-900/40"
      }`}
    >
      {/* Background soft glow for active cards */}
      {isActive && (
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-100/40 blur-2xl transition-all duration-300 group-hover:bg-blue-200/50 dark:bg-blue-900/10" />
      )}

      <div className="flex flex-col h-full justify-between">
        <div>
          {/* Icon */}
          <div
            className={`inline-flex items-center justify-center rounded-xl p-3 mb-4 ${
              isActive
                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
            }`}
          >
            {renderIcon()}
          </div>

          {/* Title */}
          <h3
            className={`text-lg font-semibold tracking-tight mb-2 ${
              isActive
                ? "text-neutral-900 group-hover:text-blue-600 dark:text-neutral-100 dark:group-hover:text-blue-400"
                : "text-neutral-500 dark:text-neutral-500"
            }`}
          >
            {title}
          </h3>

          {/* Description */}
          <p
            className={`text-sm leading-relaxed mb-6 ${
              isActive
                ? "text-neutral-600 dark:text-neutral-400"
                : "text-neutral-400 dark:text-neutral-500"
            }`}
          >
            {description}
          </p>
        </div>

        {/* Badge status */}
        <div className="flex items-center">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-950/30 dark:text-emerald-450 dark:ring-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-neutral-150 px-2.5 py-1 text-xs font-medium text-neutral-550 dark:bg-neutral-800 dark:text-neutral-400">
              Coming Soon
            </span>
          )}
        </div>
      </div>
    </CardWrapper>
  );
}
