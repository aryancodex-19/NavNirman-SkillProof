"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

interface LoadingSkeletonProps {
  variant?: "dashboard" | "card" | "list" | "form";
  className?: string;
}

export default function LoadingSkeleton({ variant = "dashboard", className = "" }: LoadingSkeletonProps) {
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    initial: { opacity: 0.4 },
    animate: {
      opacity: [0.4, 0.8, 0.4],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const shimmerGrid = (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full ${className}`}
    >
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          variants={itemVariants}
          className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md p-6 h-48 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-white/10" />
            <div className="h-4 w-3/4 bg-white/10 rounded-md" />
            <div className="h-3 w-5/6 bg-white/5 rounded-md" />
          </div>
          <div className="h-3 w-1/4 bg-white/10 rounded-md" />
        </motion.div>
      ))}
    </motion.div>
  );

  const shimmerCard = (
    <motion.div
      variants={itemVariants}
      initial="initial"
      animate="animate"
      className={`rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md p-7 space-y-6 ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-white/10" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-1/3 bg-white/10 rounded-md" />
          <div className="h-3 w-1/2 bg-white/5 rounded-md" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 w-full bg-white/5 rounded-md" />
        <div className="h-3 w-full bg-white/5 rounded-md" />
        <div className="h-3 w-4/5 bg-white/5 rounded-md" />
      </div>
    </motion.div>
  );

  const shimmerList = (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={`space-y-4 w-full ${className}`}
    >
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          variants={itemVariants}
          className="rounded-xl border border-white/5 bg-white/[0.01] p-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="h-8 w-8 rounded-lg bg-white/10" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-1/4 bg-white/10 rounded-md" />
              <div className="h-3 w-1/3 bg-white/5 rounded-md" />
            </div>
          </div>
          <div className="h-8 w-20 rounded-lg bg-white/10" />
        </motion.div>
      ))}
    </motion.div>
  );

  const shimmerForm = (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={`space-y-6 max-w-2xl mx-auto rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md p-8 ${className}`}
    >
      {[...Array(3)].map((_, i) => (
        <motion.div key={i} variants={itemVariants} className="space-y-2">
          <div className="h-3 w-20 bg-white/10 rounded-md" />
          <div className="h-11 w-full bg-white/5 rounded-xl" />
        </motion.div>
      ))}
      <motion.div variants={itemVariants} className="h-11 w-32 bg-white/10 rounded-xl pt-4" />
    </motion.div>
  );

  switch (variant) {
    case "card":
      return shimmerCard;
    case "list":
      return shimmerList;
    case "form":
      return shimmerForm;
    case "dashboard":
    default:
      return shimmerGrid;
  }
}
