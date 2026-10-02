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
      <div className="absolute inset-0 bg-background pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard
            glowColor="indigo"
            className="p-10 sm:p-14 text-center space-y-6 border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-br from-indigo-950/20 via-zinc-950/60 to-purple-950/10 backdrop-blur-2xl"
          >
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-white/[0.02] blur-xl pointer-events-none" />

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider mx-auto">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Instant Setup</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
              Ready to Start Your <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                Career Journey?
              </span>
            </h2>

            <p className="text-gray-300 text-sm max-w-lg mx-auto leading-relaxed">
              Join students and recent graduates already using CareerOS to automate, build, and optimize their path to getting hired.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up" passHref>
                <AnimatedButton size="lg" variant="primary" className="w-full sm:w-auto font-bold px-8 shadow-xl">
                  Get Started for Free
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </AnimatedButton>
              </Link>
              <Link href="/sign-in" passHref>
                <AnimatedButton size="lg" variant="glass" className="w-full sm:w-auto font-bold border-white/10 hover:bg-white/5 px-8">
                  Sign In
                </AnimatedButton>
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
