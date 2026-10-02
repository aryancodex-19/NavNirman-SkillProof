"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

const TESTIMONIALS = [
  {
    quote: "SkillProof helped me completely transform my resume. The ATS Scanner highlighted exact keywords I was missing, and I landed my dream summer SWE internship!",
    author: "Elena Rostova",
    role: "Computer Science Junior",
    avatarInitial: "ER",
    gradient: "from-purple-500 to-indigo-600",
  },
  {
    quote: "The voice mock interview coach is exceptional. Having adaptive follow-up questions spoken in real-time made me feel fully prepared, and my vocal confidence score was spot on.",
    author: "Marcus Chen",
    role: "Recent CS Graduate",
    avatarInitial: "MC",
    gradient: "from-violet-500 to-pink-600",
  },
  {
    quote: "Keeping track of my LeetCode progress and maintaining my streak in the Coding Tracker kept me consistent during interview season. SkillProof is a must-have!",
    author: "Sarah Jenkins",
    role: "Software Developer",
    avatarInitial: "SJ",
    gradient: "from-indigo-500 to-purple-600",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 relative overflow-hidden bg-black/20">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Endorsed by{" "}
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Student Builders
            </span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            See how university students and early-career developers are utilizing SkillProof to accelerate their careers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((item, i) => (
            <motion.div
              key={item.author}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <GlassCard
                glowColor="purple"
                className="p-8 flex flex-col justify-between h-72 border-white/10 hover:border-purple-500/40"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className="h-4 w-4 fill-purple-400 text-purple-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-300 italic leading-relaxed">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-tr ${item.gradient} flex items-center justify-center text-white text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)]`}>
                    {item.avatarInitial}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {item.author}
                    </h4>
                    <p className="text-xs text-gray-400 font-medium">
                      {item.role}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
