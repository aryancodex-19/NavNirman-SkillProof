"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface PageTransitionProps {
  children: React.ReactNode;
  staggerChildren?: boolean;
}

export default function PageTransition({
  children,
  staggerChildren = false,
}: PageTransitionProps) {
  // Memoize container variants to avoid recreation on every render cycle
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerChildren ? 0.08 : 0,
      },
    },
  }), [staggerChildren]);

  // Memoize item variants to avoid recreation on every render cycle
  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  }), []);

  if (staggerChildren) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full"
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return (
              <motion.div variants={itemVariants} className="w-full">
                {child}
              </motion.div>
            );
          }
          return child;
        })}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{
        type: "spring" as const,
        stiffness: 100,
        damping: 17,
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
export { motion };
