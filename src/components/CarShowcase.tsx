"use client";

import { useState, useRef } from "react";
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
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  const isEven = index % 2 === 0;

  return (
    <section
      ref={ref}
      className="min-h-screen py-24 relative overflow-hidden"
      style={{
        background: isEven
          ? "linear-gradient(180deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)"
          : "linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 50%, #0a0a0a 100%)",
      }}
    >
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at ${isEven ? "20%" : "80%"} 50%, rgba(255, 23, 68, 0.1) 0%, transparent 50%)`,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid lg:grid-cols-2 gap-16 items-center ${!isEven ? "lg:flex-row-reverse" : ""}`}>
          <motion.div
            initial={{ opacity: 0, x: isEven ? -50 : 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className={`${!isEven ? "lg:order-2" : ""}`}
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff1744]/10 text-[#ff1744] text-sm font-medium mb-4"
            >
              <Sparkles size={14} />
              Service {String(index + 1).padStart(2, "0")}
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl font-bold font-display mb-4"
            >
              {service.name}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="text-[#888] text-lg mb-6"
            >
              {service.description || service.short_desc}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-3 mb-8"
            >
              {(service.features || []).slice(0, 4).map((feature, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-white/5 rounded-full text-sm text-[#aaa]"
                >
                  {feature}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-6"
            >
              <div>
                <span className="text-4xl font-bold bg-gradient-to-r from-[#ff1744] to-[#d4af37] bg-clip-text text-transparent">
                  ₹{service.price.toLocaleString()}
                </span>
                <span className="text-[#666] ml-2">onwards</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-[#888]">
                <span className="text-white font-medium">{service.duration}</span>
                <span className="ml-1">duration</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: isEven ? 50 : -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className={`relative ${!isEven ? "lg:order-1" : ""}`}
          >
            <div
              className="relative aspect-[4/3] cursor-pointer"
              onMouseEnter={() => setIsExploded(true)}
              onMouseLeave={() => setIsExploded(false)}
              onTouchStart={() => setIsExploded(!isExploded)}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-[#ff1744]/20 to-[#d4af37]/20 rounded-3xl blur-3xl"
                animate={{
                  opacity: isExploded ? 0.8 : 0.3,
                  scale: isExploded ? 1.1 : 1,
                }}
                transition={{ duration: 0.5 }}
              />

              <div className="relative w-full h-full">
                {carParts.map((part) => (
                  <motion.div
                    key={part.id}
                    className="absolute"
                    style={{
                      left: "50%",
                      top: "50%",
                      width: part.id.includes("wheel") ? "80px" : "120px",
                      height: part.id.includes("wheel") ? "80px" : "60px",
                    }}
                    initial={{ x: "-50%", y: "-50%" }}
                    animate={{
                      x: isExploded ? `calc(-50% + ${part.x}px)` : "-50%",
                      y: isExploded ? `calc(-50% + ${part.y}px)` : "-50%",
                      rotate: isExploded ? part.rotation : 0,
                      scale: hoveredPart === part.id ? 1.1 : 1,
                    }}
                    transition={{
                      duration: 0.6,
                      delay: isExploded ? part.delay : (carParts.length - 1 - carParts.indexOf(part)) * 0.02,
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                    }}
                    onMouseEnter={() => setHoveredPart(part.id)}
                    onMouseLeave={() => setHoveredPart(null)}
                  >
                    <div
                      className={`w-full h-full rounded-lg transition-colors duration-300 flex items-center justify-center text-xs font-medium ${
                        hoveredPart === part.id
                          ? "bg-[#ff1744]/80 text-white"
                          : "bg-white/10 text-white/70 border border-white/20"
                      }`}
                      style={{
                        boxShadow: hoveredPart === part.id
                          ? "0 0 30px rgba(255, 23, 68, 0.5)"
                          : "0 4px 20px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      {part.name}
                    </div>
                  </motion.div>
                ))}

                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ opacity: isExploded ? 0 : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative w-full h-full rounded-2xl overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                  </div>
                </motion.div>
              </div>

              <motion.div
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full text-sm text-[#888] border border-white/10"
                animate={{ opacity: isExploded ? 0 : 1 }}
              >
                {isExploded ? "Release to reassemble" : "Hover to explode"}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

interface ServiceBeforeAfterProps {
  service: Service;
  index: number;
}

export function ServiceBeforeAfter({ service, index }: ServiceBeforeAfterProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 });
  const isEven = index % 2 === 0;

  const beforeImages: Record<string, string> = {
    "exterior-wash": "https://images.unsplash.com/photo-1552176913-e0521bc3f7f1?w=800",
    "full-detailing": "https://images.unsplash.com/photo-1507682632009-22b0e92b1f3c?w=800",
    "ceramic-coating": "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800",
    "ppf": "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800",
    "interior-detailing": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
    "paint-correction": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800",
  };

  const afterImages: Record<string, string> = {
    "exterior-wash": "https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800",
    "full-detailing": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
    "ceramic-coating": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800",
    "ppf": "https://images.unsplash.com/photo-1494976388531-d1058494ceb8?w=800",
    "interior-detailing": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800",
    "paint-correction": "https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800",
  };

  const beforeImage = beforeImages[service.id] || "https://images.unsplash.com/photo-1552176913-e0521bc3f7f1?w=800";
  const afterImage = afterImages[service.id] || service.image;

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  };

  return (
    <section
      ref={sectionRef}
      className="min-h-screen py-24 relative overflow-hidden"
      style={{
        background: isEven
          ? "linear-gradient(180deg, #0a0a0a 0%, #0f0808 50%, #0a0a0a 100%)"
          : "linear-gradient(180deg, #0a0a0a 0%, #080a0f 50%, #0a0a0a 100%)",
      }}
    >
      <div className="absolute inset-0">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-[150px]"
          style={{
            background: isEven
              ? "radial-gradient(circle, rgba(255, 23, 68, 0.15) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)",
            left: isEven ? "10%" : "auto",
            right: isEven ? "auto" : "10%",
            top: "20%",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#ff1744]/10 to-[#d4af37]/10 border border-white/10 text-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-[#ff1744] animate-pulse" />
            Before & After Transformation
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-4">
            <span className="text-[#888]">{service.name}</span>
            <br />
            <span className="bg-gradient-to-r from-[#ff1744] to-[#d4af37] bg-clip-text text-transparent">
              Transformation
            </span>
          </h2>
          <p className="text-[#666] max-w-2xl mx-auto">
            Drag the slider to see the dramatic difference our {service.name.toLowerCase()} service makes
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div
            ref={containerRef}
            className="relative aspect-[16/9] max-w-5xl mx-auto rounded-3xl overflow-hidden cursor-ew-resize select-none shadow-2xl"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleMouseMove}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            onTouchMove={handleTouchMove}
            style={{
              boxShadow: "0 0 100px rgba(255, 23, 68, 0.2), 0 0 50px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div className="absolute inset-0">
              <Image
                src={afterImage}
                alt={`${service.name} - After`}
                fill
                className="object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            <motion.div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <div
                className="relative h-full"
                style={{ width: containerRef.current?.offsetWidth || "100%" }}
              >
                <Image
                  src={beforeImage}
                  alt={`${service.name} - Before`}
                  fill
                  className="object-cover grayscale"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute inset-0 bg-[#ff1744]/10" />
              </div>
            </motion.div>

            <motion.div
              className="absolute top-0 bottom-0 w-1 bg-white"
              style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
              animate={{
                boxShadow: isDragging
                  ? "0 0 30px rgba(255, 255, 255, 0.8)"
                  : "0 0 15px rgba(255, 255, 255, 0.5)",
              }}
            >
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl"
                animate={{ scale: isDragging ? 1.2 : 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ x: isDragging ? -3 : 0 }}
                    className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-[#0a0a0a]"
                  />
                  <motion.div
                    animate={{ x: isDragging ? 3 : 0 }}
                    className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-[#0a0a0a]"
                  />
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="absolute top-6 left-6 px-4 py-2 rounded-xl text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, rgba(255, 23, 68, 0.9), rgba(200, 20, 50, 0.9))",
                boxShadow: "0 4px 20px rgba(255, 23, 68, 0.4)",
              }}
              animate={{ scale: sliderPosition > 10 ? 1 : 0.8, opacity: sliderPosition > 10 ? 1 : 0.5 }}
            >
              <span className="text-white">BEFORE</span>
              <span className="text-white/60 ml-2">Dirty</span>
            </motion.div>

            <motion.div
              className="absolute top-6 right-6 px-4 py-2 rounded-xl text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, rgba(212, 175, 55, 0.9), rgba(180, 150, 40, 0.9))",
                boxShadow: "0 4px 20px rgba(212, 175, 55, 0.4)",
              }}
              animate={{ scale: sliderPosition < 90 ? 1 : 0.8, opacity: sliderPosition < 90 ? 1 : 0.5 }}
            >
              <span className="text-black">AFTER</span>
              <span className="text-black/60 ml-2">Pristine</span>
            </motion.div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <motion.div
                className="px-6 py-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-white/80 text-sm">
                  Drag to compare • {Math.round(sliderPosition)}% revealed
                </span>
              </motion.div>
            </div>
          </div>

          <motion.div
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            {[
              { label: "Duration", value: service.duration },
              { label: "Price", value: `₹${service.price.toLocaleString()}` },
              { label: "Rating", value: `${service.rating}★` },
              { label: "AI Score", value: `${service.ai_rating}%` },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center p-4 rounded-2xl bg-white/5 border border-white/10"
                whileHover={{ scale: 1.05, borderColor: "rgba(255, 23, 68, 0.3)" }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-[#666]">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
