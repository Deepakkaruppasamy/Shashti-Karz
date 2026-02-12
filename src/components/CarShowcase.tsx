"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import type { Service } from "@/lib/types";

interface ExplodedCarProps {
  service: Service;
  index: number;
}

const carParts = [
  { id: "hood", name: "Hood", x: 0, y: -60, rotation: -15, delay: 0 },
  { id: "roof", name: "Roof", x: 0, y: -80, rotation: 0, delay: 0.05 },
  { id: "trunk", name: "Trunk", x: 0, y: 60, rotation: 15, delay: 0.1 },
  { id: "front-bumper", name: "Front Bumper", x: -80, y: 20, rotation: -20, delay: 0.15 },
  { id: "rear-bumper", name: "Rear Bumper", x: 80, y: 20, rotation: 20, delay: 0.2 },
  { id: "left-door", name: "Left Door", x: -100, y: 0, rotation: -25, delay: 0.25 },
  { id: "right-door", name: "Right Door", x: 100, y: 0, rotation: 25, delay: 0.3 },
  { id: "front-wheel", name: "Front Wheel", x: -60, y: 60, rotation: 0, delay: 0.35 },
  { id: "rear-wheel", name: "Rear Wheel", x: 60, y: 60, rotation: 0, delay: 0.4 },
];

export function ExplodedCarSection({ service, index }: ExplodedCarProps) {
  const [isExploded, setIsExploded] = useState(false);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const isEven = index % 2 === 0;

  return (
    <section
      ref={ref}
      className="min-h-[80vh] sm:min-h-screen py-12 sm:py-24 relative overflow-hidden"
      style={{
        background: isEven ? "#0a0a0a" : "#0d0d0d",
        contain: isMobile ? "layout paint" : "none"
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={`grid lg:grid-cols-2 gap-10 sm:gap-16 items-center ${!isEven ? "lg:flex-row-reverse" : ""}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff1744]/10 text-[#ff1744] text-xs font-medium mb-4">
              <Sparkles size={12} />
              {service.id.replace(/-/g, ' ').toUpperCase()}
            </span>

            <h2 className="text-3xl sm:text-5xl font-bold font-display mb-4 text-white">
              {service.name}
            </h2>

            <p className="text-[#888] text-base sm:text-lg mb-6 max-w-xl text-pretty">
              {service.description || service.short_desc}
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {(service.benefits || []).slice(0, 3).map((benefit: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-xs text-[#aaa] border border-white/5">
                  {benefit}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-6">
              <span className="text-3xl sm:text-4xl font-bold text-gradient">
                ₹{service.price.toLocaleString()}
              </span>
              <div className="text-[#888] text-sm sm:text-base">
                <span className="text-white font-medium">{service.duration}</span>
                <span className="ml-1 opacity-60">duration</span>
              </div>
            </div>
          </motion.div>

          {/* Simple Image/Exploded view */}
          <div className="relative aspect-square sm:aspect-[4/3] w-full max-w-2xl mx-auto">
            <div
              className="relative w-full h-full cursor-pointer touch-pan-y"
              onMouseEnter={() => !isMobile && setIsExploded(true)}
              onMouseLeave={() => !isMobile && setIsExploded(false)}
              onClick={() => isMobile && setIsExploded(!isExploded)}
            >
              <div className="absolute inset-0 bg-[#ff1744]/5 rounded-3xl blur-3xl opacity-50" />

              <div className="relative w-full h-full overflow-hidden sm:overflow-visible">
                {isExploded && carParts.map((part) => (
                  <motion.div
                    key={part.id}
                    className="absolute z-20"
                    style={{
                      left: "50%",
                      top: "50%",
                      width: part.id.includes("wheel") ? "70px" : "100px",
                      height: part.id.includes("wheel") ? "70px" : "50px",
                    }}
                    initial={{ x: "-50%", y: "-50%", opacity: 0 }}
                    animate={{
                      x: `calc(-50% + ${part.x * (isMobile ? 0.4 : 1)}px)`,
                      y: `calc(-50% + ${part.y * (isMobile ? 0.4 : 1)}px)`,
                      rotate: part.rotation,
                      opacity: 1,
                      scale: hoveredPart === part.id ? 1.05 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    onMouseEnter={() => setHoveredPart(part.id)}
                    onMouseLeave={() => setHoveredPart(null)}
                  >
                    <div className={`w-full h-full rounded-lg flex items-center justify-center text-[10px] font-bold border transition-colors ${hoveredPart === part.id ? "bg-[#ff1744] border-[#ff1744] text-white" : "bg-black/80 border-white/20 text-white/70"
                      }`}>
                      {part.name}
                    </div>
                  </motion.div>
                ))}

                <motion.div
                  className="absolute inset-0 z-10"
                  animate={{
                    opacity: isExploded ? (isMobile ? 0.2 : 0) : 1,
                    scale: isExploded ? 0.9 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src={service.image}
                      alt={service.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                </motion.div>

                {!isExploded && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-xs text-white/80 border border-white/10">
                      {isMobile ? "Tap to Inspect" : "Hover to Inspect"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ServiceBeforeAfter({ service, index }: { service: Service; index: number }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isEven = index % 2 === 0;

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  return (
    <section className="py-20 relative bg-[#0a0a0a] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 text-center mb-12">
        <h3 className="text-3xl font-bold font-display text-white mb-2">Pristine Transformation</h3>
        <p className="text-[#666] text-sm">Drag slider to see {service.name} results</p>
      </div>

      <div
        ref={containerRef}
        className="relative aspect-[16/9] max-w-4xl mx-auto rounded-2xl overflow-hidden cursor-ew-resize group"
        onMouseMove={(e) => e.buttons === 1 && handleMove(e.clientX)}
        onMouseDown={(e) => handleMove(e.clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      >
        <Image src={service.image} alt="After" fill className="object-cover" />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <div className="relative h-full" style={{ width: "calc(100vw - 32px)", maxWidth: "896px" }}>
            <Image src={service.image} alt="Before" fill className="object-cover grayscale brightness-50" />
          </div>
        </div>
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
          style={{ left: `${sliderPosition}%` }}
        />
      </div>
    </section>
  );
}
