"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingButtons } from "@/components/FloatingButtons";
import { AIChatbot } from "@/components/AIChatbot";

import { facilityPhotos } from "@/lib/data";

const galleryImages = [
  ...facilityPhotos.map(p => ({ ...p, id: `fac-${p.id}` })),
  { id: 1, src: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800", title: "BMW 5 Series - Paint Correction", category: "Paint Correction" },
  { id: 2, src: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800", title: "Mercedes Interior", category: "Interior Detailing" },
  { id: 3, src: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800", title: "Audi RS7 - Ceramic Coating", category: "Ceramic Coating" },
  { id: 4, src: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800", title: "Porsche 911 - Full Detail", category: "Full Detailing" },
  { id: 5, src: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800", title: "BMW Interior Luxury", category: "Interior Detailing" },
  { id: 6, src: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800", title: "Mercedes AMG - PPF", category: "Paint Protection Film" },
  { id: 7, src: "https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800", title: "Paint Correction Process", category: "Paint Correction" },
  { id: 8, src: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800", title: "Tesla Model S", category: "Full Detailing" },
  { id: 9, src: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800", title: "Headlight Restoration", category: "Headlight Restoration" },
  { id: 10, src: "https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?w=800", title: "Wheel Detailing", category: "Wheel & Tire" },
  { id: 11, src: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800", title: "Range Rover Exterior", category: "Exterior Detailing" },
  { id: 12, src: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800", title: "Engine Bay Clean", category: "Engine Bay" },
];

const categories = ["All", "Facility", "Paint Correction", "Ceramic Coating", "Interior Detailing", "Full Detailing", "Paint Protection Film", "Exterior Detailing"];

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<typeof galleryImages[0] | null>(null);

  const filteredImages = selectedCategory === "All"
    ? galleryImages
    : galleryImages.filter(img => img.category === selectedCategory);

  const currentIndex = selectedImage ? filteredImages.findIndex(img => img.id === selectedImage.id) : -1;

  const navigateImage = (direction: "prev" | "next") => {
    if (!selectedImage) return;
    const newIndex = direction === "prev"
      ? (currentIndex - 1 + filteredImages.length) % filteredImages.length
      : (currentIndex + 1) % filteredImages.length;
    setSelectedImage(filteredImages[newIndex]);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <section className="pt-32 pb-24 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#d4af37] text-sm font-semibold tracking-widest uppercase"
            >
              Our Work
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mt-3 mb-4"
            >
              Project <span className="text-gradient-gold">Gallery</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[#888] max-w-xl mx-auto"
            >
              Explore our portfolio of premium car detailing transformations.
              Every project showcases our commitment to perfection.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat
                  ? "bg-[#ff1744] text-white"
                  : "bg-white/5 text-[#888] hover:bg-white/10 hover:text-white"
                  }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((image, i) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                onClick={() => setSelectedImage(image)}
              >
                <Image
                  src={image.src}
                  alt={image.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-sm font-semibold">{image.title}</p>
                    <p className="text-xs text-[#d4af37]">{image.category}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 p-2 text-white/50 hover:text-white"
            >
              <X size={32} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); navigateImage("prev"); }}
              className="absolute left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <ChevronLeft size={24} />
            </button>

            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-5xl max-h-[80vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video">
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-center mt-4">
                <h3 className="text-xl font-semibold">{selectedImage.title}</h3>
                <p className="text-[#d4af37]">{selectedImage.category}</p>
              </div>
            </motion.div>

            <button
              onClick={(e) => { e.stopPropagation(); navigateImage("next"); }}
              className="absolute right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <ChevronRight size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
      <FloatingButtons />
      <AIChatbot />
    </main>
  );
}
