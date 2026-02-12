"use client";

import { useEffect, useRef, ReactNode, useState } from "react";
import { motion, useInView, useAnimation, Variant } from "framer-motion";
import { useReducedMotion } from "./useReducedMotion";

type AnimationVariant = "fadeUp" | "fadeDown" | "fadeLeft" | "fadeRight" | "scale" | "blur" | "slideUp" | "stagger";

interface ScrollRevealProps {
  children: ReactNode;
  variant?: AnimationVariant;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  threshold?: number;
  isMobile?: boolean; // Prop to force mobile behavior if detection is available upstream
}

const variants: Record<AnimationVariant, { hidden: Variant; visible: Variant }> = {
  fadeUp: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
  blur: {
    hidden: { opacity: 0, filter: "blur(5px)" },
    visible: { opacity: 1, filter: "blur(0px)" },
  },
  slideUp: {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  },
  stagger: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
};

export function ScrollReveal({
  children,
  variant = "fadeUp",
  delay = 0,
  duration = 0.5,
  className = "",
  once = true,
  threshold = 0.1,
  isMobile: forcedMobile
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: threshold });
  const controls = useAnimation();
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const mobileMode = forcedMobile ?? isMobile;

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    } else if (!once) {
      controls.start("hidden");
    }
  }, [isInView, controls, once]);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  // Optimized for mobile: use simpler transitions and no physics
  const transition: any = mobileMode
    ? { duration: 0.3, delay: delay * 0.3, ease: "easeOut" }
    : { duration, delay, ease: [0.25, 0.1, 0.25, 1] };

  // Skip expensive filters on mobile
  const finalVariants = mobileMode && variant === "blur"
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : variants[variant];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={finalVariants}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, staggerDelay = 0.05, className = "" }: { children: ReactNode; staggerDelay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: isMobile ? 0.03 : staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
