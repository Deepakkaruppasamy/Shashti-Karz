"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Volume2, VolumeX, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import { useSound } from "@/hooks/useSound";
import { WaterDroplets, FoamBubbles, ShineEffect, SparkleEffect, GlossReveal } from "./VisualEffects";

type WashStage = "idle" | "entering" | "foam" | "wash" | "rinse" | "dry" | "polish" | "reveal" | "complete";

const STAGE_CONFIG: Record<WashStage, { duration: number; label: string; description: string }> = {
  idle: { duration: 0, label: "Ready", description: "Click play to start the car wash experience" },
  entering: { duration: 2000, label: "Car Entering", description: "Vehicle positioning for wash" },
  foam: { duration: 3000, label: "Foam Application", description: "Premium foam coating applied" },
  wash: { duration: 3000, label: "Deep Wash", description: "High-pressure water cleaning" },
  rinse: { duration: 2500, label: "Rinse Cycle", description: "Removing all soap residue" },
  dry: { duration: 2000, label: "Air Dry", description: "Powerful air blowers at work" },
  polish: { duration: 3000, label: "Polish & Shine", description: "Ceramic coating application" },
  reveal: { duration: 2000, label: "Final Reveal", description: "Unveiling your pristine car" },
  complete: { duration: 0, label: "Complete", description: "Your car is showroom ready!" },
};

const STAGE_ORDER: WashStage[] = ["idle", "entering", "foam", "wash", "rinse", "dry", "polish", "reveal", "complete"];

export function CarWashShowcase() {
  const { play, stop, enabled: soundEnabled } = useSound();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStage, setCurrentStage] = useState<WashStage>("idle");
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const progressRef = useRef<NodeJS.Timeout>();

  const currentStageIndex = STAGE_ORDER.indexOf(currentStage);
  const stageConfig = STAGE_CONFIG[currentStage];

  useEffect(() => {
    if (!isPlaying) return;

    const advanceStage = () => {
      const nextIndex = currentStageIndex + 1;
      if (nextIndex < STAGE_ORDER.length) {
        const nextStage = STAGE_ORDER[nextIndex];
        setCurrentStage(nextStage);
        setProgress(0);

        if (soundEnabled) {
          if (nextStage === "foam") play("foam_brush");
          if (nextStage === "wash" || nextStage === "rinse") play("water_spray");
          if (nextStage === "dry") play("air_hiss");
          if (nextStage === "polish") play("polish_shine");
          if (nextStage === "reveal") play("success");
          if (nextStage === "complete") {
            play("engine_rev");
            setIsPlaying(false);
          }
        }

        if (nextStage !== "idle" && nextStage !== "complete") {
          const duration = STAGE_CONFIG[nextStage].duration;
          timeoutRef.current = setTimeout(advanceStage, duration);
          
          const interval = 50;
          let elapsed = 0;
          progressRef.current = setInterval(() => {
            elapsed += interval;
            setProgress(Math.min((elapsed / duration) * 100, 100));
          }, interval);
        }
      }
    };

    if (currentStage === "idle") {
      if (soundEnabled) play("engine_ignition");
      advanceStage();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isPlaying, currentStage, currentStageIndex, soundEnabled, play]);

  const handlePlay = () => {
    if (currentStage === "complete") {
      setCurrentStage("idle");
      setProgress(0);
    }
    setIsPlaying(true);
    setShowControls(false);
    setTimeout(() => setShowControls(true), 3000);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  };

  const handleReset = () => {
    handlePause();
    setCurrentStage("idle");
    setProgress(0);
    stop("water_spray");
    stop("foam_brush");
    stop("air_hiss");
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#111] to-[#0a0a0a]" />
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff1744]/10 border border-[#ff1744]/30 mb-4"
          >
            <Sparkles size={16} className="text-[#ff1744]" />
            <span className="text-sm text-[#ff1744]">Interactive Demo</span>
          </motion.div>
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            <span className="text-white">Car Wash </span>
            <span className="text-gradient">Showcase</span>
          </h2>
          <p className="text-[#888] max-w-2xl mx-auto">
            Experience our premium car wash process with stunning visual effects and immersive sounds
          </p>
        </div>

        <div className="relative aspect-video rounded-2xl overflow-hidden glass-card">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center" />
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{
                x: currentStage === "entering" ? ["-100%", "0%"] : 
                   currentStage === "complete" ? ["0%", "100%"] : "0%",
                scale: currentStage === "reveal" ? [1, 1.05, 1] : 1,
              }}
              transition={{ 
                duration: currentStage === "entering" || currentStage === "complete" ? 2 : 0.5,
                ease: "easeInOut",
              }}
              className="relative w-[70%] max-w-[500px]"
            >
              <Image
                src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800"
                alt="Car being washed"
                width={500}
                height={300}
                className={`w-full h-auto transition-all duration-500 ${
                  currentStage === "polish" || currentStage === "reveal" || currentStage === "complete"
                    ? "brightness-110 contrast-110 saturate-110"
                    : currentStage === "foam" 
                    ? "brightness-95"
                    : ""
                }`}
              />
              
              <AnimatePresence>
                {currentStage === "foam" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/30 backdrop-blur-[2px]"
                  />
                )}
              </AnimatePresence>
              
              <FoamBubbles active={currentStage === "foam"} intensity={1.5} />
              <WaterDroplets active={currentStage === "wash" || currentStage === "rinse"} intensity={currentStage === "wash" ? 1.5 : 1} />
              <ShineEffect active={currentStage === "polish"} />
              <SparkleEffect active={currentStage === "reveal" || currentStage === "complete"} count={8} />
              <GlossReveal progress={currentStage === "reveal" ? progress : currentStage === "complete" ? 100 : 0} />

              <AnimatePresence>
                {currentStage === "dry" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 overflow-hidden"
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          x: ["-100%", "200%"],
                          opacity: [0, 0.6, 0],
                        }}
                        transition={{
                          duration: 0.8,
                          delay: i * 0.15,
                          repeat: Infinity,
                          repeatDelay: 0.5,
                        }}
                        className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        style={{ top: `${i * 20}%`, height: "20%" }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0a0a] to-transparent">
            <div className="flex items-center gap-4 mb-4">
              {STAGE_ORDER.slice(1, -1).map((stage, i) => {
                const stageIndex = STAGE_ORDER.indexOf(stage);
                const isActive = currentStageIndex === stageIndex;
                const isComplete = currentStageIndex > stageIndex;
                
                return (
                  <div key={stage} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full transition-all ${
                      isComplete ? "bg-green-500" : isActive ? "bg-[#ff1744] animate-pulse" : "bg-white/20"
                    }`} />
                    {i < STAGE_ORDER.length - 3 && (
                      <ChevronRight size={14} className={`${isComplete ? "text-green-500" : "text-white/20"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">{stageConfig.label}</h3>
                <p className="text-sm text-[#888]">{stageConfig.description}</p>
              </div>

              <AnimatePresence mode="wait">
                {showControls && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-3"
                  >
                    <button
                      onClick={handleReset}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      title="Reset"
                    >
                      <RotateCcw size={20} />
                    </button>
                    
                    <button
                      onClick={isPlaying ? handlePause : handlePlay}
                      className="p-4 rounded-full bg-[#ff1744] hover:bg-[#ff1744]/80 transition-colors"
                    >
                      {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                    </button>
                    
                    <div className="flex items-center gap-2 text-sm text-[#888]">
                      {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                      <span>{soundEnabled ? "Sound On" : "Sound Off"}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isPlaying && currentStage !== "idle" && currentStage !== "complete" && (
              <div className="mt-4">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#ff1744]"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.05 }}
                  />
                </div>
              </div>
            )}
          </div>

          <AnimatePresence>
            {currentStage === "idle" && !isPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              >
                <motion.button
                  onClick={handlePlay}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 px-8 py-4 rounded-full bg-[#ff1744] text-white font-semibold"
                >
                  <Play size={24} className="ml-1" />
                  <span>Start Car Wash Demo</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {currentStage === "complete" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 right-4 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/50"
              >
                <span className="text-green-400 font-medium flex items-center gap-2">
                  <Sparkles size={16} />
                  Showroom Ready!
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Foam Quality", value: "Premium", icon: "🧴" },
            { label: "Water Pressure", value: "2000 PSI", icon: "💧" },
            { label: "Dry Time", value: "< 5 min", icon: "💨" },
            { label: "Shine Level", value: "Mirror", icon: "✨" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-4 text-center"
            >
              <span className="text-2xl mb-2 block">{stat.icon}</span>
              <p className="text-sm text-[#888]">{stat.label}</p>
              <p className="font-semibold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
