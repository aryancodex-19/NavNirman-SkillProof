"use client";

import React from "react";
import { motion } from "framer-motion";

interface SpinningLogoProps {
  size?: number;
  alt?: string;
  className?: string;
}

/**
 * Shared rotating SkillProof logo.
 *
 * logo.png ships with an opaque black background, which shows as a hard square
 * against the theme's translucent panels. Three treatments stack to hide it:
 *   1. a blurred purple layer behind the image, so the logo sits on purple
 *      rather than pure black (kills the visible edge),
 *   2. mix-blend-screen, which mathematically maps black to the backdrop,
 *   3. contrast/brightness lift to keep the purple strokes vivid.
 */
export default function SpinningLogo({
  size = 32,
  alt = "SkillProof logo",
  className = "",
}: SpinningLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-xl bg-purple-600/30 blur-md"
        aria-hidden="true"
      />
      <motion.img
        src="/logo.png"
        alt={alt}
        width={size}
        height={size}
        className="relative z-10 rounded-lg bg-transparent mix-blend-screen contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]"
        style={{ width: size, height: size }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
