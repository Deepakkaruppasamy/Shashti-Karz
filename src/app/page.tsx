"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Star, ArrowRight, Sparkles, Shield, Award, Car, ArrowDown, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Ad } from "@/lib/types";
import { useState, useEffect, useRef, useMemo } from "react";
import type { Service, Review, Offer } from "@/lib/types";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/animations/ScrollReveal";
import { AnimatedCounter } from "@/components/animations/AnimatedCounter";
import { ScrollProgress } from "@/components/animations/ParallaxSection";
import { MagneticButton, TiltCard } from "@/components/animations/MagneticButton";
import { GlowingBorder, NeonText, PulsingDot } from "@/components/animations/GlowingBorder";
import { FloatingParticles } from "@/components/animations/FloatingParticles";
import { BlobBackground } from "@/components/animations/WaveBackground";
import { useLanguage } from "@/lib/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import dynamic from "next/dynamic";

// Dynamic imports for heavy components
const DynamicPriceCalculator = dynamic(() => import("@/components/PriceCalculator").then(mod => mod.PriceCalculator), { ssr: false });
import { FullPageLoader } from "@/components/animations/CarLoader";
const DynamicExplodedCarSection = dynamic(() => import("@/components/CarShowcase").then(mod => mod.ExplodedCarSection), { ssr: false });
const DynamicServiceBeforeAfter = dynamic(() => import("@/components/CarShowcase").then(mod => mod.ServiceBeforeAfter), { ssr: false });
const DynamicServiceTrackerDemo = dynamic(() => import("@/components/LiveServiceTracker").then(mod => mod.ServiceTrackerDemo), { ssr: false });
const DynamicLoyaltyProgramDemo = dynamic(() => import("@/components/LoyaltyProgram").then(mod => mod.LoyaltyProgramDemo), { ssr: false });
const DynamicServiceComparison = dynamic(() => import("@/components/ServiceComparison").then(mod => mod.ServiceComparison), { ssr: false });
const DynamicVideoTestimonials = dynamic(() => import("@/components/VideoTestimonials").then(mod => mod.VideoTestimonials), { ssr: false });
const DynamicCarWashShowcase = dynamic(() => import("@/components/CarWashShowcase").then(mod => mod.CarWashShowcase), { ssr: false });
const DynamicReviewsSection = dynamic<{ reviews: Review[] }>(() => import("@/components/ReviewsSection").then(mod => mod.ReviewsSection), { ssr: false });
const DynamicShashtiAI = dynamic(() => import("@/components/ShashtiAI").then(mod => mod.ShashtiAI), { ssr: false });
const DynamicDineshVoiceAssistant = dynamic(() => import("@/components/DineshVoiceAssistant").then(mod => mod.DineshVoiceAssistant), { ssr: false });
const VideoPromoPlayer = dynamic(() => import("@/components/ads/VideoPromoPlayer"), { ssr: false });
const InterstitialVideoPromo = dynamic(() => import("@/components/ads/InterstitialVideoPromo"), { ssr: false });

const businessInfo = {
  name: 'Shashti Karz',
  tagline: 'Car Detailing Xpert',
  phone: '+91 98765 43210',
  whatsapp: '919876543210',
};


function HeroSection({ isMobile }: { isMobile: boolean }) {
  const { t } = useLanguage();
  const [heroAd, setHeroAd] = useState<Ad | null>(null);

  useEffect(() => {
    fetch('/api/ads/delivery?position=home_hero')
      .then(res => res.json())
      .then(data => {
        if (data.ad) {
          setHeroAd(data.ad);
          fetch('/api/ads/track', { method: 'POST', body: JSON.stringify({ adId: data.ad.id, eventType: 'impression' }) });
        }
      })
      .catch(err => console.error("Ad fetch error", err));
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", isMobile ? "5%" : "100%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.99]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 0 : 5]);

  if (heroAd) {
    return (
      <section ref={containerRef} className="relative h-[70vh] sm:h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <VideoPromoPlayer
            mediaUrl={heroAd.media_url || ""}
            thumbnailUrl={heroAd.thumbnail_url}
            title={heroAd.title}
            description={heroAd.description}
            targetUrl={heroAd.target_url}
            position="hero"
            ctaText="Check Deal"
          />
        </div>
      </section>
    );
  }

  return (
    <section ref={containerRef} className="relative min-h-[85vh] sm:min-h-[120vh] flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      <motion.div style={{ y, scale, rotate }} className="absolute inset-0 z-0">
        {isMobile ? (
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200"
              alt="Premium Detail"
              fill
              className="object-cover opacity-60"
              priority
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            />
          </div>
        ) : (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-50 scale-110"
            poster="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920"
          >
            <source src="https://cdn.coverr.co/videos/coverr-car-driving-in-city-1584/1080p.mp4" type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
      </motion.div>

      {!isMobile && (
        <>
          <FloatingParticles
            count={15}
            colors={["#ff1744", "#d4af37", "#ffffff"]}
            className="z-[2]"
          />
          <BlobBackground
            count={1}
            colors={["#ff1744", "#d4af37"]}
            className="z-[1]"
          />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#ff1744]/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-[80px] pointer-events-none" />
        </>
      )}

      <motion.div
        style={{ opacity, scale }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 sm:pt-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-sm text-[#d4af37] mb-4">
            <Sparkles size={12} className="animate-pulse" />
            <span>{t('premium_detailing')}</span>
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className="text-4xl sm:text-6xl lg:text-8xl font-bold font-display mb-4 sm:mb-6 leading-[1.1] text-balance tracking-tight">
            <span className="text-white">{t('hero_title_1')} </span>
            <NeonText color="#ff1744" className="font-display">{t('hero_title_2')}</NeonText>
            <br className="hidden sm:block" />
            <span className="text-white">{t('hero_title_3')} </span>
            <NeonText color="#d4af37" className="font-display">{t('hero_title_4')}</NeonText>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm sm:text-xl text-[#888] max-w-2xl mx-auto mb-6 sm:mb-10 px-4"
        >
          {t('hero_subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
        >
          <MagneticButton strength={isMobile ? 0 : 0.1}>
            <Link
              href="/booking"
              className="btn-premium px-6 py-3.5 sm:px-8 sm:py-4 rounded-full text-base sm:text-lg font-semibold text-white inline-flex items-center justify-center gap-2 group shadow-lg"
            >
              <span>{t('book_your_service')}</span>
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </MagneticButton>
          <MagneticButton strength={isMobile ? 0 : 0.1}>
            <a
              href={`https://wa.me/${businessInfo.whatsapp}`}
              className="px-6 py-3.5 sm:px-8 sm:py-4 rounded-full bg-[#25D366] text-white font-semibold inline-flex items-center justify-center gap-2 shadow-lg"
            >
              <MessageCircle size={18} />
              <span>{t('whatsapp_us')}</span>
            </a>
          </MagneticButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-10 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { value: 500, suffix: "+", label: t('cars_detailed') },
            { value: 5.0, decimals: 1, label: t('google_rating') },
            { value: 3, suffix: "+", label: t('years_experience') },
            { value: 100, suffix: "%", label: t('satisfaction') },
          ].slice(0, isMobile ? 2 : 4).map((stat, i) => (
            <div key={i} className="text-center p-2">
              <div className="text-2xl sm:text-4xl font-bold text-gradient mb-0.5 sm:mb-1">
                <AnimatedCounter
                  end={stat.value}
                  suffix={stat.suffix || ""}
                  decimals={stat.decimals || 0}
                  duration={800}
                />
              </div>
              <div className="text-[10px] sm:text-sm text-[#666] uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
        <motion.div
          className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1.5"
        >
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-0.5 h-1.5 bg-white/40 rounded-full"
          />
        </motion.div>
      </div>
    </section>
  );
}

function ServiceIntroSection() {
  const { t } = useLanguage();
  return (
    <section className="py-12 sm:py-32 relative overflow-hidden bg-[#0a0a0a]">
      <div className="relative max-w-5xl mx-auto px-4 text-center">
        <ScrollReveal variant="fadeUp" threshold={0.1}>
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <Sparkles size={16} className="text-[#d4af37]" />
            <span className="text-white text-xs font-medium uppercase tracking-widest">{t('interactive_showcase')}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-7xl font-bold font-display mb-6 text-balance">
            <span className="text-white">{t('explore_services')}</span>
            <br />
            <span className="bg-gradient-to-r from-[#ff1744] to-[#d4af37] bg-clip-text text-transparent">
              {t('premium_services')}
            </span>
          </h2>
          <p className="text-base sm:text-xl text-[#888] max-w-2xl mx-auto">
            {t('services_intro')}
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

function WhyUsSection({ isMobile }: { isMobile: boolean }) {
  const { t } = useLanguage();
  const features = useMemo(() => [
    { icon: Shield, title: t('premium_products'), desc: t('premium_products_desc') },
    { icon: Award, title: t('certified_experts'), desc: t('certified_experts_desc') },
    { icon: Sparkles, title: t('ai_powered_care'), desc: t('ai_powered_care_desc') },
    { icon: Star, title: t('satisfaction_guarantee'), desc: t('satisfaction_guarantee_desc') }
  ], [t]);

  return (
    <section className="py-16 sm:py-24 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
          <div>
            <ScrollReveal variant="fadeRight" isMobile={isMobile}>
              <span className="text-[#ff1744] text-xs font-semibold tracking-widest uppercase">{t('why_choose_us')}</span>
              <h2 className="text-3xl sm:text-5xl font-bold font-display mt-3 mb-6">
                The <span className="text-gradient">Shashti Karz</span> {t('the_difference')}
              </h2>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              {features.map((feature, i) => (
                <div key={i} className="glass-card rounded-xl p-5 border border-white/5 h-full">
                  <feature.icon size={22} className="text-[#ff1744] mb-3" />
                  <h3 className="font-semibold text-sm sm:text-base mb-1">{feature.title}</h3>
                  <p className="text-[#888] text-xs sm:text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {!isMobile && (
            <ScrollReveal variant="fadeLeft" className="relative hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800"
                  alt="Quality Detail"
                  fill
                  className="object-cover"
                />
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const isMobile = useIsMobile();
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      const data = await res.json();
      setReviews(data || []);
    } catch (e) {
      console.error("Error fetching reviews:", e);
    }
  };

  useRealtimeSubscription({
    table: 'reviews',
    onInsert: () => fetchReviews(), // New approved review
    onUpdate: () => fetchReviews(), // Review status changed
    onDelete: () => fetchReviews(), // Review deleted
  });

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [servicesRes, reviewsRes, offersRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/reviews"),
          fetch("/api/offers"),
        ]);

        if (mounted) {
          setServices(await servicesRes.json() || []);
          setReviews(await reviewsRes.json() || []);
          setOffers(await offersRes.json() || []);
        }
      } catch (error) {
        console.error("Data load error:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  if (isLoading) {
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden selection:bg-[#ff1744]/30">
      {!isMobile && <ScrollProgress />}
      <Navbar />

      <HeroSection isMobile={isMobile} />

      {services.length > 0 && (
        <>
          <ServiceIntroSection />
          {services.slice(0, isMobile ? 2 : 3).map((service, index) => (
            <div key={service.id} className="relative">
              <DynamicExplodedCarSection service={service} index={index} />
              {!isMobile && <DynamicServiceBeforeAfter service={service} index={index} />}
            </div>
          ))}
        </>
      )}

      {services.length > 0 && (
        <ScrollReveal threshold={0.1}>
          <DynamicPriceCalculator services={services} />
        </ScrollReveal>
      )}

      {!isMobile && (
        <>
          <DynamicServiceTrackerDemo />
          <DynamicServiceComparison />
        </>
      )}

      {/* Simplified Sections for Mobile */}
      <DynamicLoyaltyProgramDemo />
      <DynamicVideoTestimonials />

      {!isMobile && <DynamicCarWashShowcase />}

      <WhyUsSection isMobile={isMobile} />

      {reviews.length > 0 && <DynamicReviewsSection reviews={reviews} />}

      {offers.length > 0 && (
        <section className="py-16 sm:py-24 px-4 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-10 text-center font-display">Exclusive Offers</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map(o => (
                <div key={o.id} className="glass-card p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff1744]/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />
                  <span className="text-3xl font-bold text-[#ff1744]">{o.discount}</span>
                  <h3 className="text-lg font-bold mt-2">{o.title}</h3>
                  <p className="text-sm text-[#888] mt-1">{o.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTASection />
      <Footer />
      <FloatingButtons />
      <DynamicShashtiAI />
      {!isMobile && <DynamicDineshVoiceAssistant />}
      <InterstitialVideoPromo position="popup" />
    </div>
  );
}

function CTASection() {
  const { t } = useLanguage();
  return (
    <section className="py-20 relative overflow-hidden bg-[#0c0c0c]">
      <div className="absolute inset-0 bg-gradient-to-r from-[#ff1744]/5 to-[#d4af37]/5" />
      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl sm:text-6xl font-bold mb-6 font-display">{t('ready_to_transform')}</h2>
        <p className="text-[#888] mb-10 text-base sm:text-lg">{t('cta_subtitle')}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/booking"
            className="btn-premium px-10 py-4 rounded-full text-lg font-bold text-white inline-flex items-center justify-center gap-2 shadow-xl"
          >
            {t('book_now')}
            <ArrowRight size={20} />
          </Link>
          <a
            href="https://wa.me/919876543210"
            className="px-10 py-4 rounded-full text-lg font-bold bg-[#25D366] text-white inline-flex items-center justify-center gap-2 shadow-xl"
          >
            <MessageCircle size={20} />
            {t('whatsapp_us')}
          </a>
        </div>
      </div>
    </section>
  );
}
