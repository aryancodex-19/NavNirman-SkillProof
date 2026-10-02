"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion, type HTMLMotionProps } from "framer-motion";

/**
 * Self-contained collapsible sidebar primitive.
 * Self-contained: no external shared-layout-bg / ease helper modules required.
 */

export const SIDEBAR_WIDTH_EXPANDED = 256;
export const SIDEBAR_WIDTH_COLLAPSED = 64;
const SIDEBAR_STORAGE_KEY = "skillproof:sidebar-collapsed";

type SidebarContextValue = {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within <AnimatedSidebar>");
  }
  return ctx;
}

interface AnimatedSidebarProviderProps {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export function AnimatedSidebarProvider({
  children,
  defaultCollapsed = false,
}: AnimatedSidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // storage unavailable (private mode) — collapse state is still fine in-memory
      }
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  // Restore persisted preference + Cmd/Ctrl+B shortcut + Escape to close drawer.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) {
        setIsCollapsed(stored === "true");
      }
    } catch {
      // ignore storage failures
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const isToggleShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b";
      if (isToggleShortcut) {
        event.preventDefault();
        toggleCollapsed();
        return;
      }
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleCollapsed]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!isMobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMobileOpen]);

  const value = useMemo(
    () => ({ isCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen, toggleMobile }),
    [isCollapsed, toggleCollapsed, isMobileOpen, toggleMobile]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

interface AnimatedSidebarProps extends HTMLMotionProps<"aside"> {
  children: React.ReactNode;
}

export function AnimatedSidebar({
  children,
  className = "",
  ...props
}: AnimatedSidebarProps) {
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* Reserves horizontal space on desktop; the rail itself is position:fixed */}
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={{
          width: isCollapsed
            ? SIDEBAR_WIDTH_COLLAPSED
            : SIDEBAR_WIDTH_EXPANDED,
        }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        style={{
          width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
        }}
        className="hidden md:block shrink-0"
      />

      {/* Mobile drawer + backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            key="sidebar-mobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden"
          >
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed top-0 left-0 h-full w-64 z-50 flex flex-col bg-black/60 border-r border-white/10 backdrop-blur-2xl"
              {...props}
            >
              {children}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop rail */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed
            ? SIDEBAR_WIDTH_COLLAPSED
            : SIDEBAR_WIDTH_EXPANDED,
          x: 0,
        }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        style={{ width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }}
        className={`hidden md:flex fixed top-0 left-0 h-full z-40 flex-col bg-black/40 border-r border-white/10 backdrop-blur-2xl ${className}`}
        {...props}
      >
        {children}
      </motion.aside>
    </>
  );
}

interface SidebarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export function SidebarTrigger({
  children,
  className = "",
  ...props
}: SidebarTriggerProps) {
  const { isCollapsed, toggleCollapsed, toggleMobile } = useSidebar();

  return (
    <button
      onClick={(event) => {
        // Desktop toggles the rail; small screens open the drawer.
        if (window.matchMedia("(min-width: 768px)").matches) {
          toggleCollapsed();
        } else {
          toggleMobile();
        }
        props.onClick?.(event);
      }}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!isCollapsed}
      className={`p-2.5 rounded-xl bg-black/40 border border-white/10 shadow-2xl backdrop-blur-md hover:bg-white/10 hover:border-purple-500/40 transition-all duration-300 cursor-pointer text-white ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SidebarContent({
  children,
  className = "",
  ...props
}: SidebarContentProps) {
  return (
    <div
      className={`flex-1 overflow-y-auto overflow-x-hidden py-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SidebarGroup({
  children,
  className = "",
  ...props
}: SidebarGroupProps) {
  return (
    <div className={`space-y-0.5 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface SidebarGroupLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SidebarGroupLabel({
  children,
  className = "",
  ...props
}: SidebarGroupLabelProps) {
  const { isCollapsed } = useSidebar();

  return (
    <AnimatePresence initial={false}>
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div
            className={`px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 ${className}`}
            {...props}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface SidebarMenuButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  isActive?: boolean;
  tooltip?: string;
}

export function SidebarMenuButton({
  children,
  isActive = false,
  tooltip,
  className = "",
  ...props
}: SidebarMenuButtonProps) {
  const { isCollapsed } = useSidebar();

  return (
    <a
      title={isCollapsed ? tooltip : undefined}
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex items-center rounded-xl text-xs font-semibold transition-all duration-300 overflow-hidden ${
        isActive
          ? "bg-purple-500/10 border-l-2 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]"
          : "text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
      } ${isCollapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-4 py-2.5"} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}

export default AnimatedSidebar;
