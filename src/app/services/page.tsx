"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Star, Clock, Check, ArrowRight, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingButtons } from "@/components/FloatingButtons";
import { AIChatbot } from "@/components/AIChatbot";
import { services, carTypes } from "@/lib/data";
import { ShimmerCard } from "@/components/animations/AdvancedShimmer";
import { MorphingCard } from "@/components/animations/MorphingCard";
import { LiquidButton } from "@/components/animations/LiquidButton";

function ServiceCard({ service, index }: { service: typeof services[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <MorphingCard
      hoverScale={1.03}
      tiltIntensity={5}
      glowColor="rgba(255, 23, 68, 0.2)"
      className="h-full"
    >
      <ShimmerCard hoverOnly className="h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="glass-card rounded-2xl overflow-hidden h-full flex flex-col"
        >
          <div className="relative h-56 overflow-hidden">
            <Image
              src={service.image}
              alt={service.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
            {service.popular && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-[#ff1744] rounded-full text-xs font-semibold">
                Most Popular
              </span>
            )}
            {service.premium && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-black rounded-full text-xs font-semibold">
                Premium
              </span>
            )}
            <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/50 backdrop-blur px-3 py-1.5 rounded-full">
              <Zap size={14} className="text-[#d4af37]" />
              <span className="text-sm text-white font-medium">{service.aiRating}% AI Score</span>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-2xl font-bold font-display">{service.name}</h3>
              <p className="text-[#aaa] text-sm mt-1">{service.shortDesc}</p>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(service.rating) ? "text-[#d4af37] fill-[#d4af37]" : "text-[#333]"}
                    />
                  ))}
                </div>
                <span className="text-sm text-[#888]">{service.rating}</span>
              </div>
              <div className="flex items-center gap-1 text-[#888] text-sm">
                <Clock size={14} />
                {service.duration}
              </div>
            </div>

            <p className="text-[#888] text-sm mb-6">{service.description}</p>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-[#d4af37] mb-3">Price by Vehicle Type:</h4>
              <div className="grid grid-cols-2 gap-2">
                {carTypes.slice(0, 4).map((car) => (
                  <div key={car.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-xs text-[#888]">{car.name}</span>
                    <span className="text-sm font-semibold">₹{Math.round(service.price * car.priceMultiplier).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[#888] hover:text-white transition-colors"
            >
              {expanded ? "Hide Details" : "Show Details"}
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                <div>
                  <h4 className="text-sm font-semibold mb-2">What&apos;s Included:</h4>
                  <ul className="space-y-2">
                    {service.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#888]">
                        <Check size={16} className="text-[#ff1744] shrink-0 mt-0.5" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Benefits:</h4>
                  <ul className="space-y-2">
                    {service.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#888]">
                        <Star size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            <Link
              href={`/booking?service=${service.id}`}
              className="mt-6 w-full block"
            >
              <LiquidButton variant="gradient" className="w-full">
                <span className="flex items-center justify-center gap-2">
                  Book This Service
                  <ArrowRight size={18} />
                </span>
              </LiquidButton>
            </Link>
          </div>
        </motion.div>
      </ShimmerCard>
    </MorphingCard>
  );
}

export default function ServicesPage() {
  const [filter, setFilter] = useState<"all" | "popular" | "premium">("all");

  const filteredServices = services.filter((service) => {
    if (filter === "popular") return service.popular;
    if (filter === "premium") return service.premium;
    return true;
  });

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <section className="pt-32 pb-16 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#ff1744] text-sm font-semibold tracking-widest uppercase"
            >
              Our Services
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mt-3 mb-4"
            >
              Premium <span className="text-gradient">Detailing</span> Services
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[#888] max-w-2xl mx-auto text-lg"
            >
              Choose from our comprehensive range of professional car care services.
              Each service is tailored to give your vehicle the treatment it deserves.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center gap-3 mb-12"
          >
            {[
              { value: "all", label: "All Services" },
              { value: "popular", label: "Popular" },
              { value: "premium", label: "Premium" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as typeof filter)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${filter === f.value
                    ? "btn-premium text-white"
                    : "bg-white/5 text-[#888] hover:bg-white/10 hover:text-white"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service, i) => (
              <ServiceCard key={service.id} service={service} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 section-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-6">
            Not Sure Which Service You Need?
          </h2>
          <p className="text-[#888] mb-8">
            Our AI-powered recommendation system can help you choose the perfect service based on your car type,
            condition, and preferences. Or speak with our experts directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/booking"
              className="btn-premium px-8 py-4 rounded-full text-lg font-semibold text-white inline-flex items-center justify-center gap-2"
            >
              Get AI Recommendation
              <Zap size={20} />
            </Link>
            <a
              href="tel:+919876543210"
              className="px-8 py-4 rounded-full border border-white/20 text-white hover:bg-white/5 transition-colors inline-flex items-center justify-center gap-2"
            >
              Call Expert
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingButtons />
      <AIChatbot />
    </main>
  );
}
