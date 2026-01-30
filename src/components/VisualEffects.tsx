"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
}

interface VisualEffectsConfig {
  reducedMotion: boolean;
  lowPowerMode: boolean;
  enabled: boolean;
}

function useVisualEffectsConfig(): VisualEffectsConfig {
  const [config, setConfig] = useState<VisualEffectsConfig>({
    reducedMotion: false,
    lowPowerMode: false,
    enabled: true,
  });

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const checkSettings = () => {
      let visualEnabled = !reducedMotion;
      try {
        const saved = localStorage.getItem("shashti_visual_prefs");
        if (saved) {
          const prefs = JSON.parse(saved);
          if (typeof prefs.enabled === "boolean") {
            visualEnabled = prefs.enabled;
          }
        }
      } catch (e) {
        console.warn("Failed to read visual prefs");
      }

      setConfig({
        reducedMotion,
        lowPowerMode: isMobile,
        enabled: visualEnabled && !reducedMotion,
      });
    };

    checkSettings();
    window.addEventListener("storage", checkSettings);
    // Custom event listener for same-tab updates
    const handleStorage = () => checkSettings();
    // We can't easily listen to "storage" on same tab, so we need a custom event or just rely on the fact that 
    // we dispatched a 'storage' event manually in the admin page? 
    // Manually dispatched 'storage' events work in the same window in some browsers, but let's add a custom event "visual-prefs-changed" for robustness if needed.
    // For now, window.dispatchEvent(new Event("storage")) DOES trigger window.addEventListener("storage") in the same window? Actually NO, it usually doesn't.
    // But since Admin is a different route than Customer page, the user is likely switching tabs or navigating.
    // If they navigate (SPA navigation), the component remounts, so checkSettings() runs.
    return () => window.removeEventListener("storage", checkSettings);
  }, []);

  return config;
}

export function WaterDroplets({
  active = false,
  intensity = 1,
  color = "#60a5fa"
}: {
  active?: boolean;
  intensity?: number;
  color?: string;
}) {
  const config = useVisualEffectsConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const frameRef = useRef<number>();
  const idRef = useRef(0);

  const createParticle = useCallback(() => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    return {
      id: idRef.current++,
      x: Math.random() * rect.width,
      y: -10,
      size: 2 + Math.random() * 4,
      speedX: (Math.random() - 0.5) * 2,
      speedY: 3 + Math.random() * 5,
      opacity: 0.5 + Math.random() * 0.5,
      color,
      life: 0,
      maxLife: 60 + Math.random() * 60,
    };
  }, [color]);

  useEffect(() => {
    if (!active || !config.enabled || config.reducedMotion) {
      setParticles([]);
      return;
    }

    const particleCount = config.lowPowerMode ? 10 : 30;
    const spawnRate = config.lowPowerMode ? 100 : 50;

    const spawnInterval = setInterval(() => {
      setParticles(prev => {
        if (prev.length >= particleCount * intensity) return prev;
        const newParticle = createParticle();
        return newParticle ? [...prev, newParticle] : prev;
      });
    }, spawnRate / intensity);

    const animate = () => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.speedX,
            y: p.y + p.speedY,
            life: p.life + 1,
            opacity: p.opacity * 0.99,
          }))
          .filter(p => p.life < p.maxLife && p.opacity > 0.1)
      );
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      clearInterval(spawnInterval);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [active, config, intensity, createParticle]);

  if (!config.enabled || config.reducedMotion) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size * 1.5,
            backgroundColor: p.color,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            transform: `translateZ(0)`,
          }}
        />
      ))}
    </div>
  );
}

export function FoamBubbles({
  active = false,
  intensity = 1
}: {
  active?: boolean;
  intensity?: number;
}) {
  const config = useVisualEffectsConfig();
  const [bubbles, setBubbles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  useEffect(() => {
    if (!active || !config.enabled || config.reducedMotion) {
      setBubbles([]);
      return;
    }

    const bubbleCount = config.lowPowerMode ? 15 : 40;

    const interval = setInterval(() => {
      setBubbles(prev => {
        if (prev.length >= bubbleCount * intensity) return prev;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return prev;
        return [...prev, {
          id: idRef.current++,
          x: Math.random() * rect.width,
          y: rect.height + 10,
          size: 4 + Math.random() * 12,
          speedX: (Math.random() - 0.5) * 1,
          speedY: -(1 + Math.random() * 2),
          opacity: 0.3 + Math.random() * 0.4,
          color: "#ffffff",
          life: 0,
          maxLife: 100 + Math.random() * 100,
        }];
      });
    }, 100 / intensity);

    const animate = () => {
      setBubbles(prev =>
        prev
          .map(b => ({
            ...b,
            x: b.x + b.speedX + Math.sin(b.life * 0.1) * 0.5,
            y: b.y + b.speedY,
            life: b.life + 1,
            opacity: b.opacity * 0.995,
          }))
          .filter(b => b.life < b.maxLife && b.y > -20)
      );
      requestAnimationFrame(animate);
    };

    const frame = requestAnimationFrame(animate);
    return () => {
      clearInterval(interval);
      cancelAnimationFrame(frame);
    };
  }, [active, config, intensity]);

  if (!config.enabled || config.reducedMotion) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map(b => (
        <div
          key={b.id}
          className="absolute rounded-full border border-white/30"
          style={{
            left: b.x,
            top: b.y,
            width: b.size,
            height: b.size,
            backgroundColor: `rgba(255,255,255,${b.opacity * 0.2})`,
            opacity: b.opacity,
            transform: `translateZ(0)`,
          }}
        />
      ))}
    </div>
  );
}

export function ShineEffect({
  active = false,
  delay = 0
}: {
  active?: boolean;
  delay?: number;
}) {
  const config = useVisualEffectsConfig();

  if (!config.enabled || config.reducedMotion) return null;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, x: "-100%" }}
          animate={{ opacity: 1, x: "200%" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, delay, ease: "easeInOut" }}
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          <div
            className="absolute inset-y-0 w-1/4"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              transform: "skewX(-20deg)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SparkleEffect({
  active = false,
  count = 5
}: {
  active?: boolean;
  count?: number;
}) {
  const config = useVisualEffectsConfig();
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    if (!active || !config.enabled) {
      setSparkles([]);
      return;
    }

    const newSparkles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
    }));
    setSparkles(newSparkles);
  }, [active, count, config.enabled]);

  if (!config.enabled || config.reducedMotion) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {sparkles.map(s => (
        <motion.div
          key={s.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 0.8,
            delay: s.delay,
            repeat: Infinity,
            repeatDelay: 1,
          }}
          className="absolute w-2 h-2"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        >
          <svg viewBox="0 0 20 20" className="w-full h-full text-[#d4af37]">
            <path
              fill="currentColor"
              d="M10 0l2.5 7.5L20 10l-7.5 2.5L10 20l-2.5-7.5L0 10l7.5-2.5z"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

export function HeadlightGlow({ active = false }: { active?: boolean }) {
  const config = useVisualEffectsConfig();

  if (!config.enabled || config.reducedMotion) return null;

  return (
    <AnimatePresence>
      {active && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.3, 0.6, 0.3], scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute left-[20%] top-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.3, 0.6, 0.3], scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute right-[20%] top-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

export function ExhaustSmoke({ active = false }: { active?: boolean }) {
  const config = useVisualEffectsConfig();
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!active || !config.enabled || config.reducedMotion) {
      setParticles([]);
      return;
    }

    const interval = setInterval(() => {
      setParticles(prev => {
        if (prev.length >= 20) return prev;
        return [...prev, {
          id: idRef.current++,
          x: 50 + Math.random() * 10,
          y: 80,
          size: 10 + Math.random() * 20,
          speedX: -0.5 - Math.random() * 0.5,
          speedY: -0.3 - Math.random() * 0.3,
          opacity: 0.15 + Math.random() * 0.1,
          color: "#888888",
          life: 0,
          maxLife: 80,
        }];
      });
    }, 150);

    const animate = () => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.speedX,
            y: p.y + p.speedY,
            size: p.size * 1.02,
            life: p.life + 1,
            opacity: p.opacity * 0.97,
          }))
          .filter(p => p.life < p.maxLife && p.opacity > 0.02)
      );
      requestAnimationFrame(animate);
    };

    const frame = requestAnimationFrame(animate);
    return () => {
      clearInterval(interval);
      cancelAnimationFrame(frame);
    };
  }, [active, config]);

  if (!config.enabled || config.reducedMotion) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.opacity,
            filter: `blur(${p.size / 3}px)`,
            transform: `translateZ(0)`,
          }}
        />
      ))}
    </div>
  );
}

export function MotionBlur({
  active = false,
  direction = "right"
}: {
  active?: boolean;
  direction?: "left" | "right";
}) {
  const config = useVisualEffectsConfig();

  if (!config.enabled || config.reducedMotion) return null;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: direction === "right"
              ? "linear-gradient(90deg, rgba(255,23,68,0.1) 0%, transparent 30%)"
              : "linear-gradient(270deg, rgba(255,23,68,0.1) 0%, transparent 30%)",
          }}
        />
      )}
    </AnimatePresence>
  );
}

export function GlossReveal({
  progress = 0,
  direction = "left"
}: {
  progress: number;
  direction?: "left" | "right";
}) {
  const config = useVisualEffectsConfig();

  if (!config.enabled) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        clipPath: direction === "left"
          ? `inset(0 ${100 - progress}% 0 0)`
          : `inset(0 0 0 ${100 - progress}%)`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
        }}
      />
      <SparkleEffect active={progress > 80} count={3} />
    </div>
  );
}
