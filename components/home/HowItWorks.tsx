"use client";

import React from "react";
import { motion } from "framer-motion";
import { UserPlus, Sparkles, Trophy } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

const STEPS = [
  {
    step: "01",
    title: "Connect Profile",
    description: "Enter your skills and target roles, or link your existing resume file to kickstart the system context.",
    icon: UserPlus,
    glow: "indigo" as const,
  },
  {
    step: "02",
    title: "AI Optimization",
    description: "Use all 9 specialized instruments to tailor documents, complete mocks, and track DSA progress.",
    icon: Sparkles,
    glow: "violet" as const,
  },
  {
    step: "03",
    title: "Get Hired",
    description: "Submit resume drafts, nail interviews with mock experience, and land top roles.",
    icon: Trophy,
    glow: "pink" as const,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 relative overflow-hidden bg-zinc-950/40">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-black text-white">
            Simple Path to Professional Success
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Follow our 3-step structured timeline to elevate your career assets and stand out to recruiters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector Line (visible on desktop) */}
          <div className="absolute top-1/2 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-pink-500/20 -translate-y-1/2 hidden md:block z-0 pointer-events-none" />

          {STEPS.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative z-10"
            >
              <GlassCard
                glowColor={item.glow}
                className="p-8 flex flex-col justify-between h-72 border-white/5 hover:scale-[1.02] transition-transform"
              >
                <div className="space-y-6">
                  {/* Step Header */}
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-3xl font-black bg-gradient-to-r from-indigo-500/30 to-violet-500/30 bg-clip-text text-transparent">
                      {item.step}
                    </span>
                  </div>

                  {/* Step Body */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="h-1.5 w-12 rounded-full bg-indigo-500/25 mt-4" />
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
