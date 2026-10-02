"use client";

import React from "react";
import { motion } from "framer-motion";

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#0a0a0f]">
      {/* Background dot grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay" 
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />
      
      {/* Floating Orb 1: Indigo */}
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[130px]"
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 50, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating Orb 2: Violet */}
      <motion.div
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[150px]"
        animate={{
          x: [0, -90, 60, 0],
          y: [0, 80, -70, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating Orb 3: Pink */}
      <motion.div
        className="absolute top-[35%] right-[20%] w-[450px] h-[450px] rounded-full bg-pink-500/5 blur-[120px]"
        animate={{
          x: [0, 100, -80, 0],
          y: [0, 120, -90, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Additional subtle accent ring */}
      <div className="absolute top-[20%] left-[60%] w-[800px] h-[800px] rounded-full border border-white/[0.01] -z-10" />
    </div>
  );
}

export default React.memo(AnimatedBackground);
