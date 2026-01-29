"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Star, Clock, ArrowRight, Sparkles, Shield, Award, Play, Car, ArrowDown, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingButtons } from "@/components/FloatingButtons";
import { ShashtiAI } from "@/components/ShashtiAI";
import { ExplodedCarSection, ServiceBeforeAfter } from "@/components/CarShowcase";
import { PriceCalculator } from "@/components/PriceCalculator";
import { ServiceTrackerDemo } from "@/components/LiveServiceTracker";
import { LoyaltyProgramDemo } from "@/components/LoyaltyProgram";
import { ServiceComparison } from "@/components/ServiceComparison";
import { VideoTestimonials } from "@/components/VideoTestimonials";
import { CarWashShowcase } from "@/components/CarWashShowcase";
import { useState, useEffect, useRef } from "react";
import type { Service, Review, Offer } from "@/lib/types";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/animations/ScrollReveal";
import { AnimatedCounter } from "@/components/animations/AnimatedCounter";
import { MouseParallax, ScrollProgress } from "@/components/animations/ParallaxSection";
import { MagneticButton, TiltCard } from "@/components/animations/MagneticButton";
import { GlowingBorder, NeonText, PulsingDot } from "@/components/animations/GlowingBorder";
import { FloatingParticlesReact } from "@/components/animations/FloatingParticles";
import { TypewriterText } from "@/components/animations/TypewriterText";
import { LiquidButton } from "@/components/animations/LiquidButton";
import { ShimmerCard } from "@/components/animations/AdvancedShimmer";
import { BlobBackground } from "@/components/animations/WaveBackground";
import { useSound } from "@/hooks/useSound";
import { HeadlightGlow, ExhaustSmoke } from "@/components/VisualEffects";
import { useLanguage } from "@/lib/LanguageContext";

const businessInfo = {
  name: 'Shashti Karz',
  tagline: 'Car Detailing Xpert',
  phone: '+91 98765 43210',
  whatsapp: '919876543210',
};

function HeroSection() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);
  const carX = useTransform(scrollYProgress, [0, 1], ["-20%", "120%"]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 5]);

  return (
    <section ref={containerRef} className="relative min-h-[120vh] flex items-center justify-center overflow-hidden">
      <motion.div style={{ y, scale, rotate }} className="absolute inset-0 z-0">
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
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-[#0a0a0a]/40 backdrop-grayscale-[0.5]" />
      </motion.div>

      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#0a0a0a_100%)] opacity-60" />
        <div className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-[#0a0a0a] to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </div>

      {/* Floating Particles */}
      <FloatingParticlesReact
        count={40}
        colors={["#ff1744", "#d4af37", "#ffffff"]}
        className="z-[2]"
      />

      {/* Blob Background */}
      <BlobBackground
        count={3}
        colors={["#ff1744", "#d4af37", "#4CAF50"]}
        className="z-[1]"
      />

      <MouseParallax strength={30}><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff1744]/20 rounded-full blur-[120px]" /></MouseParallax>
      <MouseParallax strength={-20}><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#d4af37]/20 rounded-full blur-[120px]" /></MouseParallax>

      <motion.div
        style={{ opacity, scale }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[#d4af37] mb-6">
            <Sparkles size={16} className="animate-pulse" />
            <span>{t('premium_detailing')}</span>
            <PulsingDot color="#22c55e" size={8} />
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold font-display mb-6">
            <span className="text-white">{t('hero_title_1')} </span>
            <NeonText color="#ff1744" className="font-display">{t('hero_title_2')}</NeonText>
            <br />
            <span className="text-white">{t('hero_title_3')} </span>
            <NeonText color="#d4af37" className="font-display">{t('hero_title_4')}</NeonText>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg sm:text-xl text-[#888] max-w-2xl mx-auto mb-10"
        >
          {t('hero_subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <MagneticButton strength={0.2}>
            <Link
              href="/booking"
              className="btn-premium px-8 py-4 rounded-full text-lg font-semibold text-white inline-flex items-center justify-center gap-2 group"
            >
              <span>{t('book_your_service')}</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </MagneticButton>
          <MagneticButton strength={0.2}>
            <a
              href={`https://wa.me/${businessInfo.whatsapp}?text=${encodeURIComponent("Hi! I'd like to know more about your car detailing services.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-full bg-[#25D366] text-white hover:bg-[#25D366]/90 transition-colors inline-flex items-center justify-center gap-2 group"
            >
              <MessageCircle size={20} />
              <span>{t('whatsapp_us')}</span>
            </a>
          </MagneticButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8"
        >
          {[
            { value: 500, suffix: "+", label: t('cars_detailed') },
            { value: 5.0, decimals: 1, label: t('google_rating') },
            { value: 3, suffix: "+", label: t('years_experience') },
            { value: 100, suffix: "%", label: t('satisfaction') },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
              className="text-center"
            >
              <div className="text-3xl sm:text-4xl font-bold text-gradient mb-1">
                <AnimatedCounter
                  end={stat.value}
                  suffix={stat.suffix || ""}
                  decimals={stat.decimals || 0}
                  duration={2000}
                />
              </div>
              <div className="text-sm text-[#888]">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        style={{ x: carX }}
        className="absolute bottom-20 left-0 opacity-20 pointer-events-none"
      >
        <Car size={100} className="text-[#ff1744]" />
      </motion.div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xs text-[#666] uppercase tracking-widest"
        >
          {t('scroll_to_explore')}
        </motion.p>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-2 bg-white/50 rounded-full"
          />
        </motion.div>
      </div>
    </section>
  );
}

function ServiceIntroSection() {
  const { t } = useLanguage();
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#111] to-[#0a0a0a]" />
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 bg-gradient-conic from-[#ff1744]/10 via-transparent to-[#d4af37]/10 rounded-full blur-3xl" />
      </motion.div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <ScrollReveal variant="fadeUp">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-[#ff1744]/10 to-[#d4af37]/10 border border-white/10 mb-8"
          >
            <Sparkles size={20} className="text-[#d4af37]" />
            <span className="text-white font-medium">{t('interactive_showcase')}</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-green-500"
            />
          </motion.div>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp" delay={0.1}>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold font-display mb-6">
            <span className="text-white">{t('explore_services')}</span>
            <br />
            <span className="bg-gradient-to-r from-[#ff1744] via-[#ff4081] to-[#d4af37] bg-clip-text text-transparent">
              {t('premium_services')}
            </span>
          </h2>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp" delay={0.2}>
          <p className="text-xl text-[#888] max-w-3xl mx-auto mb-12">
            {t('services_intro')}
          </p>
        </ScrollReveal>

        <motion.div
          className="mt-16"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ArrowDown size={32} className="mx-auto text-[#ff1744]" />
        </motion.div>
      </div>
    </section>
  );
}

function WhyUsSection() {
  const { t } = useLanguage();
  const features = [
    { icon: Shield, title: t('premium_products'), desc: t('premium_products_desc') },
    { icon: Award, title: t('certified_experts'), desc: t('certified_experts_desc') },
    { icon: Sparkles, title: t('ai_powered_care'), desc: t('ai_powered_care_desc') },
    { icon: Star, title: t('satisfaction_guarantee'), desc: t('satisfaction_guarantee_desc') }
  ];

  return (
    <section className="py-24 hero-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <ScrollReveal variant="fadeRight">
              <span className="text-[#ff1744] text-sm font-semibold tracking-widest uppercase">{t('why_choose_us')}</span>
              <h2 className="text-4xl sm:text-5xl font-bold font-display mt-3 mb-6">
                The <span className="text-gradient">Shashti Karz</span> {t('the_difference')}
              </h2>
              <p className="text-[#888] mb-10">
                {t('why_us_subtitle')}
              </p>
            </ScrollReveal>

            <StaggerContainer staggerDelay={0.15} className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, i) => (
                <StaggerItem key={i}>
                  <TiltCard maxTilt={8} className="h-full">
                    <div className="glass-card rounded-xl p-6 h-full">
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff1744]/20 to-[#d4af37]/20 flex items-center justify-center mb-4"
                      >
                        <feature.icon size={24} className="text-[#ff1744]" />
                      </motion.div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-[#888] text-sm">{feature.desc}</p>
                    </div>
                  </TiltCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>

          <ScrollReveal variant="fadeLeft" className="relative">
            <div className="relative rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800"
                alt="Premium car detailing"
                width={600}
                height={700}
                className="object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
            </div>

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="absolute -bottom-6 -left-6"
            >
              <GlowingBorder className="rounded-xl">
                <div className="p-4 bg-[#0a0a0a]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#ff1744] flex items-center justify-center">
                      <Star className="text-white fill-white" size={24} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        <AnimatedCounter end={5.0} decimals={1} />
                      </div>
                      <div className="text-xs text-[#888]">Google Rating</div>
                    </div>
                  </div>
                </div>
              </GlowingBorder>
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function OffersSection({ offers }: { offers: Offer[] }) {
  const { t } = useLanguage();
  return (
    <section className="py-24 section-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="fadeUp" className="text-center mb-12">
          <span className="text-[#d4af37] text-sm font-semibold tracking-widest uppercase">{t('special_offers')}</span>
          <h2 className="text-4xl sm:text-5xl font-bold font-display mt-3">
            {t('exclusive_deals')}
          </h2>
        </ScrollReveal>

        <StaggerContainer staggerDelay={0.1} className="grid md:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <StaggerItem key={offer.id}>
              <TiltCard maxTilt={8}>
                <GlowingBorder className="rounded-2xl h-full">
                  <div className="p-6 bg-[#111] rounded-2xl relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#ff1744]/20 to-transparent rounded-full blur-2xl" />
                    <div className="relative">
                      <motion.span
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="text-4xl font-bold text-gradient"
                      >
                        {offer.discount}
                      </motion.span>
                      <h3 className="text-xl font-semibold mt-2">{offer.title}</h3>
                      <p className="text-[#888] text-sm mt-2">{offer.description}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-[#666]">{t('valid_till')} {offer.valid_till}</span>
                        <span className="px-3 py-1 bg-[#ff1744]/10 rounded-full text-xs text-[#ff1744] font-mono">
                          {offer.code}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlowingBorder>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const { t } = useLanguage();
  return (
    <section className="py-24 hero-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="fadeUp" className="text-center mb-12">
          <span className="text-[#ff1744] text-sm font-semibold tracking-widest uppercase">{t('testimonials')}</span>
          <h2 className="text-4xl sm:text-5xl font-bold font-display mt-3">
            {t('what_customers_say')}
          </h2>
        </ScrollReveal>

        <StaggerContainer staggerDelay={0.1} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((review) => (
            <StaggerItem key={review.id}>
              <TiltCard maxTilt={8} className="h-full">
                <div className="glass-card rounded-2xl p-6 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <Image
                      src={review.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"}
                      alt={review.name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-sm">{review.name}</h4>
                      <p className="text-xs text-[#888]">{review.car}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={14} className="text-[#d4af37] fill-[#d4af37]" />
                    ))}
                  </div>
                  <p className="text-[#aaa] text-sm mb-3">&quot;{review.comment}&quot;</p>
                  <span className="text-xs text-[#666]">{review.service}</span>
                </div>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

function CTASection() {
  const { t } = useLanguage();
  return (
    <section className="py-24 relative overflow-hidden">
      <motion.div
        animate={{
          background: [
            "radial-gradient(ellipse at 0% 0%, rgba(255, 23, 68, 0.2) 0%, transparent 50%)",
            "radial-gradient(ellipse at 100% 100%, rgba(255, 23, 68, 0.2) 0%, transparent 50%)",
            "radial-gradient(ellipse at 0% 0%, rgba(255, 23, 68, 0.2) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff1744]/10 rounded-full blur-[150px]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <ScrollReveal variant="scale">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-6">
            {t('ready_to_transform')}
          </h2>
          <p className="text-lg text-[#888] mb-10 max-w-2xl mx-auto">
            {t('cta_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <MagneticButton>
              <Link
                href="/booking"
                className="btn-premium px-10 py-5 rounded-full text-lg font-semibold text-white inline-flex items-center justify-center gap-2 group"
              >
                {t('book_now')}
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight size={20} />
                </motion.span>
              </Link>
            </MagneticButton>
            <MagneticButton>
              <a
                href={`https://wa.me/${businessInfo.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-5 rounded-full text-lg font-semibold bg-[#25D366] text-white inline-flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} />
                {t('whatsapp_us')}
              </a>
            </MagneticButton>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [servicesRes, reviewsRes, offersRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/reviews"),
          fetch("/api/offers"),
        ]);

        const [servicesData, reviewsData, offersData] = await Promise.all([
          servicesRes.json(),
          reviewsRes.json(),
          offersRes.json(),
        ]);

        setServices(servicesData);
        setReviews(reviewsData);
        setOffers(offersData);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <ScrollProgress />
      <Navbar />

      <HeroSection />

      {!isLoading && services.length > 0 && (
        <>
          <ServiceIntroSection />

          {services.slice(0, 3).map((service, index) => (
            <div key={service.id}>
              <ExplodedCarSection service={service} index={index} />
              <ServiceBeforeAfter service={service} index={index} />
            </div>
          ))}
        </>
      )}

      {!isLoading && services.length > 0 && <PriceCalculator services={services} />}

      <ServiceTrackerDemo />

      <ServiceComparison />

      <LoyaltyProgramDemo />

      <VideoTestimonials />

      <CarWashShowcase />

      <WhyUsSection />

      {!isLoading && offers.length > 0 && <OffersSection offers={offers} />}
      {!isLoading && reviews.length > 0 && <ReviewsSection reviews={reviews} />}

      <CTASection />
      <Footer />
      <FloatingButtons />
      <ShashtiAI />
    </main>
  );
}
