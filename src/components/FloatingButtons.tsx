"use client";

import { Phone, Calendar, MessageCircle, Rotate3d } from "lucide-react";
import { businessInfo } from "@/lib/data";
import Link from "next/link";

export function FloatingButtons() {
  const whatsappUrl = `https://wa.me/${businessInfo.whatsapp}?text=Hi, I'm interested in your car detailing services.`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      <Link
        href="/virtual-tour"
        className="w-14 h-14 rounded-full bg-[#d4af37] hover:bg-[#b8860b] flex items-center justify-center shadow-lg shadow-[#d4af37]/30 transition-all hover:scale-110 group relative"
        title="360° Virtual Tour"
      >
        <Rotate3d size={24} className="text-white group-hover:rotate-180 transition-transform duration-700" />
        <span className="absolute right-full mr-4 px-3 py-1.5 rounded-lg bg-black/80 text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          360° virtual tour
        </span>
      </Link>
      <a
        href={`tel:${businessInfo.phone}`}
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#128C7E] flex items-center justify-center shadow-lg shadow-[#25D366]/30 transition-all hover:scale-110"
        title="Call Now"
      >
        <Phone size={24} className="text-white" />
      </a>

      <Link
        href="/booking"
        className="w-14 h-14 rounded-full btn-premium flex items-center justify-center shadow-lg shadow-[#ff1744]/30 transition-all hover:scale-110 animate-pulse-glow"
        title="Book Service"
      >
        <Calendar size={24} className="text-white" />
      </Link>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#128C7E] flex items-center justify-center shadow-lg shadow-[#25D366]/30 transition-all hover:scale-110"
        title="WhatsApp"
      >
        <MessageCircle size={24} className="text-white" />
      </a>
    </div>
  );
}
