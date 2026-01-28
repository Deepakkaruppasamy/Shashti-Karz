"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Youtube } from "lucide-react";
import { businessInfo } from "@/lib/data";

export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
<div>
              <div className="flex items-center gap-3 mb-6">
                  <Image
                    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/ChatGPT-Image-Dec-8-2025-10_12_14-AM-1-1768823187171.png?width=200&height=200&resize=contain"
                    alt="Shashti Karz Logo"
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain"
                    priority
                  />
                <div>
                  <h3 className="text-xl font-bold font-display text-gradient">{businessInfo.name}</h3>
                  <p className="text-xs text-[#888] tracking-widest uppercase">{businessInfo.tagline}</p>
                </div>
              </div>
            <p className="text-[#888] text-sm leading-relaxed">
              Premium car detailing services in Tirupur. We bring your car back to showroom condition with our expert services.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6 text-white">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { href: "/services", label: "Our Services" },
                { href: "/booking", label: "Book Appointment" },
                { href: "/gallery", label: "Gallery" },
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#888] hover:text-[#ff1744] transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6 text-white">Services</h4>
            <ul className="space-y-3">
              {[
                "Ceramic Coating",
                "Paint Protection Film",
                "Full Detailing",
                "Interior Detailing",
                "Paint Correction",
              ].map((service) => (
                <li key={service}>
                  <Link href="/services" className="text-[#888] hover:text-[#ff1744] transition-colors text-sm">
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6 text-white">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-[#ff1744] mt-0.5 shrink-0" />
                <span className="text-[#888] text-sm">{businessInfo.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-[#ff1744] shrink-0" />
                <a href={`tel:${businessInfo.phone}`} className="text-[#888] hover:text-white text-sm transition-colors">
                  {businessInfo.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-[#ff1744] shrink-0" />
                <a href={`mailto:${businessInfo.email}`} className="text-[#888] hover:text-white text-sm transition-colors">
                  {businessInfo.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={18} className="text-[#ff1744] mt-0.5 shrink-0" />
                <div className="text-[#888] text-sm">
                  <p>Mon-Fri: {businessInfo.hours.weekdays}</p>
                  <p>Sat: {businessInfo.hours.saturday}</p>
                  <p>Sun: {businessInfo.hours.sunday}</p>
                </div>
              </li>
            </ul>

            <div className="flex gap-4 mt-6">
              <a href={businessInfo.social.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#ff1744]/20 flex items-center justify-center transition-colors">
                <Instagram size={18} className="text-[#888] hover:text-[#ff1744]" />
              </a>
              <a href={businessInfo.social.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#ff1744]/20 flex items-center justify-center transition-colors">
                <Facebook size={18} className="text-[#888] hover:text-[#ff1744]" />
              </a>
              <a href={businessInfo.social.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#ff1744]/20 flex items-center justify-center transition-colors">
                <Youtube size={18} className="text-[#888] hover:text-[#ff1744]" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#666] text-sm">
            © 2026 {businessInfo.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-[#666] hover:text-white text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-[#666] hover:text-white text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
