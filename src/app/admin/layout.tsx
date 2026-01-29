"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Menu } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <AdminSidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2.5 rounded-xl bg-gradient-to-br from-[#ff1744]/20 to-[#d4af37]/20 border border-white/10 backdrop-blur-xl text-white hover:from-[#ff1744]/30 hover:to-[#d4af37]/30 transition-all shadow-lg"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 lg:ml-64 w-full pb-16 lg:pb-0">{/* Added pb-16 for mobile bottom nav */}
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
