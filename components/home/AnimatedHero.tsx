"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import AnimatedButton from "@/components/ui/AnimatedButton";

export default function AnimatedHero() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 overflow-hidden">
      {/* Ambient glowing radial spots */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[550px] w-[550px] rounded-full bg-purple-600/10 blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[130px]" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10 text-center space-y-8">
        {/* Badge Pill */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-purple-500/30 text-purple-300 text-xs font-semibold shadow-[0_0_20px_rgba(168,85,247,0.2)] backdrop-blur-xl"
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
          <span>Next-Gen Career Acceleration Platform</span>
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
          <span className="text-gray-300">AI Verified</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08] text-white"
        >
          Prove Your Skills. <br />
          <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(168,85,247,0.35)]">
            Not Just Claim Them.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-normal"
        >
          The unified AI workspace that takes students from learning &rarr; building &rarr; applying &rarr; voice interviewing &rarr; getting hired with proof.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link href="/sign-up" passHref>
            <AnimatedButton
              size="lg"
              variant="primary"
              className="w-full sm:w-auto font-bold px-8 flex items-center gap-2"
            >
              <span className="inline-flex items-center gap-2">
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            </AnimatedButton>
          </Link>
          <Link href="/sign-in" passHref>
            <AnimatedButton
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto font-bold px-8 bg-white text-black hover:bg-gray-100 shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:border-transparent"
            >
              <span>Access Workspace</span>
            </AnimatedButton>
          </Link>
        </motion.div>

        {/* Subtle trust markers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="pt-8 flex items-center justify-center gap-6 text-xs text-gray-400"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-purple-400" />
            <span>9 Specialized AI Engines</span>
          </div>
          <span className="text-gray-600">•</span>
          <div>Real-time ATS Scanning</div>
          <span className="text-gray-600">•</span>
          <div>Adaptive Voice Mocks</div>
        </motion.div>
      </div>
    </section>
  );
}
