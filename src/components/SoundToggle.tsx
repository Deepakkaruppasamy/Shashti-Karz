"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { useSound } from "@/hooks/useSound";

export function SoundToggle() {
  const { enabled, volume, toggleSound, setVolume, play } = useSound();
  const [showSlider, setShowSlider] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSlider(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    toggleSound();
    if (!enabled) {
      setTimeout(() => play("click"), 50);
    }
  };

  const VolumeIcon = !enabled ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div ref={containerRef} className="relative">
      <motion.button
        onClick={handleToggle}
        onMouseEnter={() => enabled && setShowSlider(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`p-2 rounded-full transition-all ${
          enabled 
            ? "bg-[#ff1744]/20 text-[#ff1744]" 
            : "bg-white/5 text-[#666] hover:text-white"
        }`}
        title={enabled ? "Sound On" : "Sound Off"}
      >
        <VolumeIcon size={20} />
        {enabled && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
          />
        )}
      </motion.button>

      <AnimatePresence>
        {showSlider && enabled && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            onMouseLeave={() => setShowSlider(false)}
            className="absolute top-full mt-2 right-0 p-4 glass-card rounded-xl min-w-[200px] z-50"
          >
            <div className="flex items-center gap-3 mb-3">
              <VolumeIcon size={16} className="text-[#888]" />
              <span className="text-sm text-white">Volume</span>
              <span className="text-xs text-[#666] ml-auto">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:bg-[#ff1744]
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:shadow-[#ff1744]/30"
            />
            <div className="flex justify-between text-[10px] text-[#666] mt-1">
              <span>Quiet</span>
              <span>Loud</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SoundToggleCompact() {
  const { enabled, toggleSound, play } = useSound();

  const handleToggle = () => {
    toggleSound();
    if (!enabled) {
      setTimeout(() => play("click"), 50);
    }
  };

  return (
    <motion.button
      onClick={handleToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`p-1.5 rounded-lg transition-all ${
        enabled 
          ? "bg-[#ff1744]/20 text-[#ff1744]" 
          : "bg-white/5 text-[#666] hover:text-white"
      }`}
      title={enabled ? "Sound On" : "Sound Off"}
    >
      {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
    </motion.button>
  );
}
