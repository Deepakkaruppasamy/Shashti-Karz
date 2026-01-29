"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, Calendar, Phone, LogOut, Rotate3d } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { SoundToggle } from "@/components/SoundToggle";
import { businessInfo } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useSound } from "@/hooks/useSound";

import { useLanguage } from "@/lib/LanguageContext";
import { Languages, ChevronDown } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut, isLoading } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const { play } = useSound();
  const [showLang, setShowLang] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const handleNavClick = () => {
    play("click");
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "User";

  const navLinks = [
    { href: "/", label: t('home') },
    { href: "/services", label: t('services') },
    { href: "/booking", label: t('book_now') },
    { href: "/gallery", label: t('gallery') },
    { href: "/rewards", label: "Rewards", highlight: true },
    ...(user ? [{ href: "/my-bookings", label: "My Bookings" }] : []),
    { href: "/contact", label: t('contact') },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/ChatGPT-Image-Dec-8-2025-10_12_14-AM-1-1768823187171.png?width=200&height=200&resize=contain"
              alt="Shashti Karz Logo"
              width={48}
              height={48}
              className="w-12 h-12 object-contain"
              priority
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold font-display text-gradient">{businessInfo.name}</h1>
              <p className="text-xs text-[#888] tracking-widest uppercase">{businessInfo.tagline}</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#888] hover:text-white transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#ff1744] to-[#d4af37] group-hover:w-full transition-all duration-300" />
              </Link>
            ))}

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLang(!showLang)}
                className="flex items-center gap-2 text-sm font-medium text-[#888] hover:text-white transition-colors"
              >
                <Languages size={18} className="text-[#d4af37]" />
                <span className="uppercase">{language}</span>
                <ChevronDown size={14} className={`transition-transform ${showLang ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showLang && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-32 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                  >
                    {[
                      { code: 'en', name: 'English' },
                      { code: 'hi', name: 'Hindi' },
                      { code: 'ta', name: 'Tamil' }
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as any);
                          setShowLang(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors ${language === lang.code ? 'text-[#ff1744] font-bold' : 'text-[#888]'}`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>


          <div className="hidden lg:flex items-center gap-4">
            <SoundToggle />
            {!isLoading && user ? (
              <>
                <NotificationBell />
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{displayName.charAt(0).toUpperCase()}</span>
                  </div>
                  {displayName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#888] hover:text-[#ff1744] transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                <User size={18} />
                {t('login')}
              </Link>
            )}
            <Link
              href="/booking"
              className="btn-premium px-6 py-3 rounded-full text-sm font-semibold text-white flex items-center gap-2"
            >
              <Calendar size={18} />
              {t('book_now')}
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-white"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#111] border-t border-white/5"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block py-3 text-lg font-medium text-white/80 hover:text-white border-b border-white/5"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                {!isLoading && user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white"
                    >
                      <User size={18} />
                      {displayName}
                    </Link>
                    <button
                      onClick={() => { handleLogout(); setIsOpen(false); }}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-red-500/20 text-red-500"
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white"
                  >
                    <User size={18} />
                    {t('login')}
                  </Link>
                )}
                <Link
                  href="/booking"
                  onClick={() => setIsOpen(false)}
                  className="btn-premium flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-semibold"
                >
                  <Calendar size={18} />
                  {t('book_now')}
                </Link>
                <a
                  href={`tel:${businessInfo.phone}`}
                  className="btn-gold flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold"
                >
                  <Phone size={18} />
                  Call Now
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
