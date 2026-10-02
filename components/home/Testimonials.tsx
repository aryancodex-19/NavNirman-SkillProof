"use client";

import React from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";

const TESTIMONIALS = [
  {
    quote: "CareerOS helped me completely transform my resume. The ATS Scanner highlighted exact keywords I was missing, and I landed my summer software engineering internship at a top tech company!",
    author: "Elena Rostova",
    role: "Computer Science Junior",
    avatarInitial: "ER",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    quote: "The voice mock interview coach is game-changing. Having adaptive follow-up questions spoken in real-time made me feel fully prepared, and my vocal confidence score was spot on.",
    author: "Marcus Chen",
    role: "Recent CS Graduate",
    avatarInitial: "MC",
    gradient: "from-violet-500 to-pink-600",
  },
  {
    quote: "Keeping track of my LeetCode progress and maintaining my streak in the Coding Tracker helped keep me consistent during interview season. Highly recommend CareerOS!",
    author: "Sarah Jenkins",
    role: "Self-taught Developer",
    avatarInitial: "SJ",
    gradient: "from-pink-500 to-rose-600",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 relative overflow-hidden bg-zinc-950/20">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-black text-white">
            Endorsed by Student Builders
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            See how university students and early-career developers are utilizing CareerOS to optimize their placement assets.
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
                glowColor="none"
                className="p-8 flex flex-col justify-between h-72 border-white/5 hover:border-white/10"
              >
                <p className="text-xs text-gray-300 italic leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                  <div className={`h-9 w-9 rounded-full bg-gradient-to-tr ${item.gradient} flex items-center justify-center text-white text-xs font-bold shadow-md`}>
                    {item.avatarInitial}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {item.author}
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
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
