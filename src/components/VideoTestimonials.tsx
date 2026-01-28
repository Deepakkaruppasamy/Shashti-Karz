"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Play, Pause, Star, ChevronLeft, ChevronRight, Quote, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { VideoTestimonial } from "@/lib/types";

const demoTestimonials: VideoTestimonial[] = [
  {
    id: "1",
    user_id: null,
    name: "Rajesh Kumar",
    car: "BMW 5 Series",
    service: "Ceramic Coating",
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail_url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600",
    rating: 5,
    quote: "Absolutely stunning results! My car looks better than when I bought it. The team at Shashti Karz is incredibly professional.",
    approved: true,
    featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    user_id: null,
    name: "Priya Sharma",
    car: "Mercedes C-Class",
    service: "Full Detailing",
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail_url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600",
    rating: 5,
    quote: "Professional service with attention to every detail. They treated my car like their own. Highly recommended!",
    approved: true,
    featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    user_id: null,
    name: "Arun Patel",
    car: "Audi Q7",
    service: "PPF Installation",
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail_url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600",
    rating: 5,
    quote: "The PPF installation was flawless. My car is now protected for years! The best investment for my new car.",
    approved: true,
    featured: true,
    created_at: new Date().toISOString(),
  },
];

interface VideoTestimonialsProps {
  showDemo?: boolean;
}

export function VideoTestimonials({ showDemo = true }: VideoTestimonialsProps) {
  const [testimonials, setTestimonials] = useState<VideoTestimonial[]>(showDemo ? demoTestimonials : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!showDemo) {
      fetchTestimonials();
    }
  }, [showDemo]);

  useEffect(() => {
    if (!isPlaying) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, testimonials.length]);

  const fetchTestimonials = async () => {
    const { data } = await supabase
      .from("video_testimonials")
      .select("*")
      .eq("approved", true)
      .order("featured", { ascending: false });
    
    if (data && data.length > 0) {
      setTestimonials(data);
    }
  };

  const currentTestimonial = testimonials[currentIndex];

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsPlaying(false);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsPlaying(false);
  };

  if (testimonials.length === 0) return null;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0d080a] to-[#0a0a0a]" />
      <motion.div
        className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full blur-[200px]"
        style={{ background: "radial-gradient(circle, rgba(255, 23, 68, 0.1), transparent)" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff1744]/10 border border-[#ff1744]/20 text-[#ff1744] text-sm mb-4">
            <Play size={16} />
            Video Stories
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Customer <span className="text-gradient">Transformations</span>
          </h2>
          <p className="text-[#888] max-w-2xl mx-auto">
            Watch real customer stories and see the amazing transformations
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="relative aspect-video rounded-2xl overflow-hidden"
                style={{
                  boxShadow: "0 0 80px rgba(255, 23, 68, 0.2), 0 0 40px rgba(0, 0, 0, 0.5)",
                }}
              >
                {isPlaying ? (
                  <iframe
                    ref={videoRef}
                    src={`${currentTestimonial.video_url}?autoplay=1&mute=${isMuted ? 1 : 0}`}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <>
                    <Image
                      src={currentTestimonial.thumbnail_url}
                      alt={currentTestimonial.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsPlaying(true)}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-20 h-20 rounded-full bg-[#ff1744] flex items-center justify-center">
                        <Play size={32} className="text-white ml-1" />
                      </div>
                    </motion.button>
                  </>
                )}

                {isPlaying && (
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      onClick={() => setIsMuted(!isMuted)}
                      className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm"
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      onClick={() => setIsPlaying(false)}
                      className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm"
                    >
                      <Pause size={18} />
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between mt-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goToPrev}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <ChevronLeft size={24} />
              </motion.button>

              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => {
                      setCurrentIndex(i);
                      setIsPlaying(false);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      i === currentIndex ? "w-8 bg-[#ff1744]" : "w-2 bg-white/30"
                    }`}
                    whileHover={{ scale: 1.2 }}
                  />
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goToNext}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <ChevronRight size={24} />
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="glass-card rounded-2xl p-8"
              >
                <Quote size={48} className="text-[#ff1744]/30 mb-4" />
                
                <p className="text-xl text-[#ccc] mb-6 leading-relaxed">
                  &quot;{currentTestimonial.quote}&quot;
                </p>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center text-xl font-bold">
                    {currentTestimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{currentTestimonial.name}</h4>
                    <p className="text-sm text-[#888]">{currentTestimonial.car}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/10">
                  <div className="flex gap-1">
                    {[...Array(currentTestimonial.rating)].map((_, i) => (
                      <Star key={i} size={16} className="text-[#d4af37] fill-[#d4af37]" />
                    ))}
                  </div>
                  <span className="text-sm text-[#888]">{currentTestimonial.service}</span>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="grid grid-cols-3 gap-3">
              {testimonials.map((t, i) => (
                <motion.button
                  key={t.id}
                  onClick={() => {
                    setCurrentIndex(i);
                    setIsPlaying(false);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative aspect-video rounded-xl overflow-hidden ${
                    i === currentIndex ? "ring-2 ring-[#ff1744]" : "opacity-50"
                  }`}
                >
                  <Image
                    src={t.thumbnail_url}
                    alt={t.name}
                    fill
                    className="object-cover"
                  />
                  {i !== currentIndex && (
                    <div className="absolute inset-0 bg-black/40" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
