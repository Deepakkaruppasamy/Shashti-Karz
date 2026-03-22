"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Star, Clock, Check, ArrowRight, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingButtons } from "@/components/FloatingButtons";
import { AIChatbot } from "@/components/AIChatbot";
import { useAppSettings } from "@/hooks/useAppSettings";
import { ShimmerCard } from "@/components/animations/AdvancedShimmer";
import { MorphingCard } from "@/components/animations/MorphingCard";
import { LiquidButton } from "@/components/animations/LiquidButton";
import { ServiceComments } from "@/components/ServiceComments";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { BrandedLoader } from "@/components/animations/BrandedLoader";

function ServiceCard({ service, carTypes, index }: { service: any; carTypes: any[]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "comments">("details");
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    // Delay fetching to prevent simultaneous requests locking up the browser
    const timer = setTimeout(() => {
      checkInitialStatus();
    }, index * 150 + 100);

    return () => clearTimeout(timer);
  }, [user, service.id, index]);

  const checkInitialStatus = async () => {
    try {
      // Fetch likes count
      const { count } = await supabase
        .from("service_likes")
        .select("*", { count: "exact", head: true })
        .eq("service_id", service.id);

      setLikesCount(count || 0);

      // Check if user liked
      if (user) {
        const { data } = await supabase
          .from("service_likes")
          .select("*")
          .eq("service_id", service.id)
          .eq("user_id", user.id)
          .maybeSingle();

        setIsLiked(!!data);
      }
    } catch (error) {
      console.error("Error checking status:", error);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to like services");
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from("service_likes")
          .delete()
          .eq("service_id", service.id)
          .eq("user_id", user.id);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from("service_likes")
          .insert({ service_id: service.id, user_id: user.id });
        setLikesCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error liking service:", error);
    }
  };

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
              src={service.image_url || service.image} // Fallback for old data structure
              alt={service.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
            {(service.popular || service.is_popular) && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-[#ff1744] rounded-full text-xs font-semibold">
                Most Popular
              </span>
            )}
            {(service.premium || service.is_premium) && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-black rounded-full text-xs font-semibold">
                Premium
              </span>
            )}
            <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/50 backdrop-blur px-3 py-1.5 rounded-full z-10 transition-transform hover:scale-110 active:scale-95 cursor-pointer" onClick={handleLike}>
              <Star size={14} className={`${isLiked ? "text-red-500 fill-red-500" : "text-white"}`} />
              <span className="text-sm text-white font-medium">{likesCount} Likes</span>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-2xl font-bold font-display">{service.name}</h3>
              <p className="text-[#aaa] text-sm mt-1">{service.shortDesc || service.short_desc}</p>
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
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                {carTypes.slice(0, 4).map((car) => (
                  <div key={car.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-xs text-[#888]">{car.name}</span>
                    <span className="text-sm font-semibold">₹{Math.round(service.price * (car.priceMultiplier || car.price_multiplier || 1)).toLocaleString()}</span>
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
                <div className="flex gap-4 border-b border-white/10 mb-4">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === "details" ? "text-white" : "text-[#888]"}`}
                  >
                    Details
                    {activeTab === "details" && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff1744]" />}
                  </button>
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === "comments" ? "text-white" : "text-[#888]"}`}
                  >
                    Comments
                    {activeTab === "comments" && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff1744]" />}
                  </button>
                </div>

                {activeTab === "details" ? (
                  <>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">What&apos;s Included:</h4>
                      <ul className="space-y-2">
                        {service.steps.map((step: string, i: number) => (
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
                        {service.benefits.map((benefit: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[#888]">
                            <Star size={14} className="text-[#d4af37] shrink-0 mt-0.5" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="py-2">
                    <ServiceComments serviceId={service.id} serviceName={service.name} />
                  </div>
                )}
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
  const { services, carTypes, loading } = useAppSettings();
  const [filter, setFilter] = useState<"all" | "popular" | "premium">("all");

  if (loading) return <BrandedLoader fullPage />;

  const filteredServices = services.filter((service) => {
    // Exclude packages from the services catalog
    const packageIds = ['basic', 'premium', 'ultimate'];
    const packageNames = ['Basic Wash', 'Ultimate Protection', 'Premium Detail'];
    const isPackage = packageIds.includes(service.id) || packageNames.includes(service.name);

    if (isPackage) return false;

    if (filter === "popular") return service.popular || service.is_popular;
    if (filter === "premium") return service.premium || service.is_premium;
    return service.active !== false; // Only show active services
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
            className="flex flex-wrap justify-center gap-3 mb-12"
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
              <ServiceCard key={service.id} service={service} carTypes={carTypes} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Master Detailers Section */}
      <section className="py-24 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="max-w-xl">
              <span className="text-[#d4af37] text-sm font-bold tracking-[0.3em] uppercase mb-4 block">The Artisans</span>
              <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-6">MEET OUR <span className="text-gradient">MASTER</span> DETAILERS</h2>
              <p className="text-[#888] leading-relaxed">
                Our technicians aren't just staff; they are certified artisans with over 10,000 hours of experience in surface restoration and protection.
              </p>
            </div>
            <Link href="/gallery" className="text-sm font-bold flex items-center gap-2 group text-[#888] hover:text-white transition-colors">
              VIEW RECENT MASTERPIECES
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Vikram R.",
                specialty: "Ceramic Master",
                exp: "12+ Years",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop",
                tag: "Precision"
              },
              {
                name: "Arjun S.",
                specialty: "Paint Correction Specialist",
                exp: "8 Years",
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&auto=format&fit=crop",
                tag: "Focus"
              },
              {
                name: "Sanjay K.",
                specialty: "Interior Restoration Art",
                exp: "10 Years",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&h=200&auto=format&fit=crop",
                tag: "Craft"
              },
            ].map((detailer, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-3xl p-8 border border-white/5 group hover:border-[#ff1744]/30 transition-all"
              >
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden mb-6 border-2 border-white/10 group-hover:border-[#ff1744]/50 transition-colors">
                    <img src={detailer.avatar} alt={detailer.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  </div>
                  <span className="absolute -top-2 -right-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-[#888] group-hover:text-white">
                    {detailer.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-1">{detailer.name}</h3>
                <p className="text-[#d4af37] text-xs font-black uppercase tracking-widest mb-4">{detailer.specialty}</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-[10px] text-[#666] uppercase font-bold">Experience</span>
                  <span className="text-sm font-bold text-white">{detailer.exp}</span>
                </div>
              </motion.div>
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
              href="tel:+917358303550"
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
