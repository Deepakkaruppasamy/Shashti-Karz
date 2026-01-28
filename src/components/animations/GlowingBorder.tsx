"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "./useReducedMotion";

interface GlowingBorderProps {
  children: ReactNode;
  className?: string;
  borderColor?: string;
  glowColor?: string;
  animate?: boolean;
}

export function GlowingBorder({
  children,
  className = "",
  borderColor = "#ff1744",
  glowColor = "rgba(255, 23, 68, 0.5)",
  animate = true,
}: GlowingBorderProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion || !animate) {
    return (
      <div
        className={`relative p-[2px] rounded-2xl ${className}`}
        style={{ background: borderColor }}
      >
        <div className="relative z-10 rounded-2xl bg-[#0a0a0a]">{children}</div>
      </div>
    );
  }

  return (
    <motion.div
      className={`relative p-[2px] rounded-2xl ${className}`}
      style={{
        background: `linear-gradient(135deg, ${borderColor}, #d4af37, ${borderColor})`,
        backgroundSize: "200% 200%",
      }}
      animate={{
        backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl blur-xl"
        style={{ background: glowColor }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <div className="relative z-10 rounded-2xl bg-[#0a0a0a]">{children}</div>
    </motion.div>
  );
}

interface PulsingDotProps {
  color?: string;
  size?: number;
  className?: string;
}

export function PulsingDot({ color = "#ff1744", size = 12, className = "" }: PulsingDotProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div
        className={`rounded-full ${className}`}
        style={{ width: size, height: size, backgroundColor: color }}
      />
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [1, 0, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

interface NeonTextProps {
  children: ReactNode;
  className?: string;
  color?: string;
  animate?: boolean;
}

export function NeonText({
  children,
  className = "",
  color = "#ff1744",
  animate = true,
}: NeonTextProps) {
  const prefersReducedMotion = useReducedMotion();

  const style = {
    textShadow: `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}, 0 0 40px ${color}`,
    color: "#fff",
  };

  if (prefersReducedMotion || !animate) {
    return (
      <span className={className} style={style}>
        {children}
      </span>
    );
  }

  return (
    <motion.span
      className={className}
      style={style}
      animate={{
        textShadow: [
          `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}, 0 0 40px ${color}`,
          `0 0 10px ${color}, 0 0 20px ${color}, 0 0 40px ${color}, 0 0 80px ${color}`,
          `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}, 0 0 40px ${color}`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.span>
  );
}

interface GradientBorderProps {
  children: ReactNode;
  className?: string;
  borderWidth?: number;
  gradientColors?: string[];
  animate?: boolean;
}

export function GradientBorder({
  children,
  className = "",
  borderWidth = 2,
  gradientColors = ["#ff1744", "#d4af37", "#ff1744"],
  animate = true,
}: GradientBorderProps) {
  const prefersReducedMotion = useReducedMotion();
  const gradient = `linear-gradient(135deg, ${gradientColors.join(", ")})`;

  if (prefersReducedMotion || !animate) {
    return (
      <div
        className={`relative ${className}`}
        style={{
          padding: borderWidth,
          background: gradient,
          borderRadius: "inherit",
        }}
      >
        <div className="bg-[#0a0a0a] rounded-inherit h-full" style={{ borderRadius: "inherit" }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`relative ${className}`}
      style={{
        padding: borderWidth,
        background: gradient,
        backgroundSize: "200% 200%",
        borderRadius: "inherit",
      }}
      animate={{
        backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <div className="bg-[#0a0a0a] h-full" style={{ borderRadius: "inherit" }}>
        {children}
      </div>
    </motion.div>
  );
}

interface ShimmerEffectProps {
  className?: string;
  width?: string;
  height?: string;
}

export function ShimmerEffect({ className = "", width = "100%", height = "20px" }: ShimmerEffectProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div
        className={`bg-white/5 rounded ${className}`}
        style={{ width, height }}
      />
    );
  }

  return (
    <motion.div
      className={`bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded ${className}`}
      style={{ width, height, backgroundSize: "200% 100%" }}
      animate={{
        backgroundPosition: ["-200% 0", "200% 0"],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}
