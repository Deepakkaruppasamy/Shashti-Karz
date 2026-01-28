"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "./useReducedMotion";

interface CarLoaderProps {
  size?: number;
  className?: string;
}

export function CarLoader({ size = 120, className = "" }: CarLoaderProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-8 h-8 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size / 2 }}>
      <motion.svg
        viewBox="0 0 120 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <motion.path
          d="M20 45 L25 30 L40 25 L80 25 L95 30 L100 45 L20 45"
          stroke="#ff1744"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M35 25 L45 15 L75 15 L85 25"
          stroke="#ff1744"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="35"
          cy="45"
          r="8"
          stroke="#d4af37"
          strokeWidth="2"
          fill="none"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.circle
          cx="85"
          cy="45"
          r="8"
          stroke="#d4af37"
          strokeWidth="2"
          fill="none"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.circle
          cx="50"
          cy="20"
          r="2"
          fill="#ff1744"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="70"
          cy="20"
          r="2"
          fill="#ff1744"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.svg>
      
      <motion.div
        className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff1744]/50 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export function DetailingLoader({ className = "" }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={`flex items-center justify-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-[#ff1744] rounded-full" />
        <div className="w-2 h-2 bg-[#d4af37] rounded-full" />
        <div className="w-2 h-2 bg-[#ff1744] rounded-full" />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 rounded-full"
          style={{
            background: i % 2 === 0 ? "#ff1744" : "#d4af37",
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            delay: i * 0.15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function SprayLoader({ className = "" }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-[#ff1744]">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`relative w-20 h-20 ${className}`}>
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-[#ff1744] rounded-full"
          style={{
            left: "50%",
            top: "50%",
            transformOrigin: "0 0",
          }}
          animate={{
            x: [0, Math.cos((i * Math.PI * 2) / 8) * 30],
            y: [0, Math.sin((i * Math.PI * 2) / 8) * 30],
            opacity: [1, 0],
            scale: [1, 0.5],
          }}
          transition={{
            duration: 1,
            delay: i * 0.1,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full" />
      </motion.div>
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-50">
      <CarLoader size={160} />
      <motion.p
        className="mt-8 text-[#888] text-sm tracking-widest uppercase"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        Loading Premium Experience
      </motion.p>
    </div>
  );
}

interface ProgressLoaderProps {
  progress: number;
  className?: string;
}

export function ProgressLoader({ progress, className = "" }: ProgressLoaderProps) {
  return (
    <div className={`relative w-full h-2 bg-white/10 rounded-full overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ff1744] to-[#d4af37]"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
