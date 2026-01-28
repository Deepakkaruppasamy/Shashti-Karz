"use client";

import { useRef, ReactNode, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useReducedMotion } from "./useReducedMotion";

interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
  duration?: number;
  staggerChildren?: number;
  once?: boolean;
}

export function TextReveal({
  children,
  className = "",
  delay = 0,
  duration = 0.5,
  staggerChildren = 0.03,
  once = true,
}: TextRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: 0.5 });
  const prefersReducedMotion = useReducedMotion();

  const words = children.split(" ");

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delay,
            staggerChildren,
          },
        },
      }}
      className={className}
    >
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            variants={{
              hidden: { y: "100%", opacity: 0 },
              visible: { y: 0, opacity: 1 },
            }}
            transition={{ duration, ease: [0.25, 0.1, 0.25, 1] }}
            className="inline-block"
          >
            {word}
          </motion.span>
          <span>&nbsp;</span>
        </span>
      ))}
    </motion.div>
  );
}

interface CharacterRevealProps {
  children: string;
  className?: string;
  delay?: number;
  staggerChildren?: number;
  once?: boolean;
}

export function CharacterReveal({
  children,
  className = "",
  delay = 0,
  staggerChildren = 0.02,
  once = true,
}: CharacterRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: 0.5 });
  const prefersReducedMotion = useReducedMotion();

  const characters = children.split("");

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delay,
            staggerChildren,
          },
        },
      }}
      className={className}
      aria-label={children}
    >
      {characters.map((char, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.div>
  );
}

interface TypewriterProps {
  children: string;
  className?: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
}

export function Typewriter({
  children,
  className = "",
  speed = 50,
  delay = 0,
  cursor = true,
}: TypewriterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !ref.current || !isInView) return;

    const element = ref.current;
    element.textContent = "";
    
    let i = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < children.length) {
          element.textContent = children.slice(0, i + 1);
          i++;
        } else {
          clearInterval(interval);
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [children, speed, delay, prefersReducedMotion, isInView]);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      <span ref={ref}></span>
      {cursor && (
        <motion.span
          animate={{ opacity: [0, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="inline-block w-[2px] h-[1em] bg-current ml-1 align-middle"
        />
      )}
    </div>
  );
}

interface SplitTextProps {
  children: string;
  className?: string;
  lineClassName?: string;
  delay?: number;
}

export function SplitText({
  children,
  className = "",
  lineClassName = "",
  delay = 0,
}: SplitTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const prefersReducedMotion = useReducedMotion();

  const lines = children.split("\n");

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delay,
            staggerChildren: 0.1,
          },
        },
      }}
      className={className}
    >
      {lines.map((line, i) => (
        <div key={i} className="overflow-hidden">
          <motion.div
            variants={{
              hidden: { y: "100%" },
              visible: { y: 0 },
            }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className={lineClassName}
          >
            {line}
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
}
