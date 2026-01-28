"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useReducedMotion } from "./animations/useReducedMotion";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  className = "",
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl cursor-ew-resize select-none ${className}`}
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
    >
      <div className="relative aspect-video">
        <Image
          src={afterImage}
          alt={afterLabel}
          fill
          className="object-cover"
          draggable={false}
        />
        
        <motion.div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
          initial={prefersReducedMotion ? {} : { width: "100%" }}
          animate={{ width: `${sliderPosition}%` }}
          transition={{ duration: 0 }}
        >
          <div className="relative w-full h-full" style={{ width: containerRef.current?.offsetWidth || "100%" }}>
            <Image
              src={beforeImage}
              alt={beforeLabel}
              fill
              className="object-cover"
              draggable={false}
            />
          </div>
        </motion.div>

        <motion.div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xl">
            <div className="flex items-center gap-1">
              <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                <path d="M6 10L2 6L6 2" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                <path d="M2 2L6 6L2 10" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </motion.div>

        <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full text-sm font-medium">
          {beforeLabel}
        </div>
        <div className="absolute top-4 right-4 px-3 py-1 bg-[#ff1744] rounded-full text-sm font-medium">
          {afterLabel}
        </div>
      </div>
    </div>
  );
}

interface ComparisonCardProps {
  beforeImage: string;
  afterImage: string;
  title: string;
  description?: string;
  className?: string;
}

export function ComparisonCard({
  beforeImage,
  afterImage,
  title,
  description,
  className = "",
}: ComparisonCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative aspect-[4/3]">
        <Image
          src={beforeImage}
          alt={`${title} - Before`}
          fill
          className="object-cover"
        />
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src={afterImage}
            alt={`${title} - After`}
            fill
            className="object-cover"
          />
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        <div className="absolute bottom-4 left-4 right-4">
          <motion.div
            animate={{ y: isHovered ? -10 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            {description && <p className="text-sm text-[#888]">{description}</p>}
          </motion.div>
          
          <motion.div
            className="mt-3 flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.3 }}
          >
            <span className="px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs">
              {isHovered ? "After" : "Before"}
            </span>
            <span className="text-xs text-[#888]">Hover to compare</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
