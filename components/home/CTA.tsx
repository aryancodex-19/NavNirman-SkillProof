"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import AnimatedButton from "@/components/ui/AnimatedButton";

export default function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-purple-600/10 blur-[140px]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard
            glowColor="purple"
            className="p-10 sm:p-16 text-center space-y-6 border-white/10 shadow-[0_8px_40px_rgba(139,92,246,0.25)] relative overflow-hidden bg-gradient-to-br from-purple-950/20 via-black/60 to-indigo-950/20 backdrop-blur-2xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mx-auto shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span>Instant AI Access</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
              Ready to Accelerate Your <br />
              <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
                Career Journey?
              </span>
            </h2>

            <p className="text-gray-300 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              Join students and recent graduates already using SkillProof to build, verify, and optimize their path to getting hired.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up" passHref>
                <AnimatedButton size="lg" variant="primary" className="w-full sm:w-auto font-bold px-8">
                  <span>Get Started for Free</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </AnimatedButton>
              </Link>
              <Link href="/sign-in" passHref>
                <AnimatedButton size="lg" variant="secondary" className="w-full sm:w-auto font-bold px-8">
                  <span>Sign In</span>
                </AnimatedButton>
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
