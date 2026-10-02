"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import AnimatedButton from "@/components/ui/AnimatedButton";

export default function AnimatedHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-24 overflow-hidden">
      {/* Background Blobs and Gradients */}
      <div className="absolute inset-0 z-0 bg-background">
        <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-pink-500/5 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-violet-600/5 blur-[150px] animate-pulse" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10 text-center space-y-8">
        {/* Badge Pill */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-indigo-300 text-xs font-semibold shadow-2xl backdrop-blur-md"
        >
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span>The Complete Student Career Suite</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] text-white"
        >
          From Learning to Hiring. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
            All in One Place.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
        >
          AI-powered platform that takes students from learning &rarr; building &rarr; applying &rarr; interviewing &rarr; getting hired.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link href="/sign-up" passHref>
            <AnimatedButton size="lg" variant="primary" className="w-full sm:w-auto font-bold">
              Get Started for Free
              <ArrowRight className="h-4 w-4 ml-1" />
            </AnimatedButton>
          </Link>
          <Link href="/sign-in" passHref>
            <AnimatedButton size="lg" variant="glass" className="w-full sm:w-auto font-bold border-white/10 hover:bg-white/5">
              Access Workspace
            </AnimatedButton>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
