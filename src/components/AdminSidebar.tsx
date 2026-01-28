"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, Package, Settings, LogOut, Bell,
  DollarSign, Play, Sparkles, Brain, Receipt, ImageIcon, Menu, X, Hammer
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  ai?: boolean;
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { id: "analytics", label: "AI Analytics", icon: Brain, href: "/admin?tab=analytics", ai: true },
  { id: "finance", label: "Finance", icon: DollarSign, href: "/admin?tab=finance" },
  { id: "billing", label: "Billing", icon: Receipt, href: "/admin/billing" },
  { id: "bookings", label: "Bookings", icon: Calendar, href: "/admin?tab=bookings" },
  { id: "tracking", label: "Service Tracking", icon: Play, href: "/admin?tab=tracking" },
  { id: "inventory", label: "Inventory", icon: Package, href: "/admin/inventory" },
  { id: "notifications", label: "Notifications", icon: Bell, href: "/admin/notifications", badge: "Send", badgeColor: "bg-green-500/20 text-green-500" },
  { id: "workers", label: "Workers", icon: Users, href: "/admin?tab=workers" },
  { id: "worker-portal", label: "Worker Portal", icon: Hammer, href: "/worker", badge: "Live", badgeColor: "bg-[#ff1744]/20 text-[#ff1744]" },
  { id: "services", label: "Services", icon: Package, href: "/admin?tab=services" },
  { id: "gallery", label: "Gallery", icon: ImageIcon, href: "/admin?tab=gallery" },
  { id: "users", label: "Customers", icon: Users, href: "/admin?tab=users" },
  { id: "settings", label: "Settings", icon: Settings, href: "/admin/settings" },
];

export function AdminSidebar({ mobileMenuOpen, setMobileMenuOpen }: { mobileMenuOpen?: boolean; setMobileMenuOpen?: (open: boolean) => void }) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const isActive = (item: NavItem) => {
    if (item.href === "/admin") return pathname === "/admin";
    return pathname.startsWith(item.href);
  };

  return (
    <>
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-[#0d0d0d] border-r border-white/5 z-50 transition-transform lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 lg:p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 lg:gap-3">
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/ChatGPT-Image-Dec-8-2025-10_12_14-AM-1-1768823187171.png?width=200&height=200&resize=contain"
              alt="Shashti Karz Logo"
              width={40}
              height={40}
              className="w-8 h-8 lg:w-10 lg:h-10 object-contain"
              priority
            />
            <div>
              <span className="text-base lg:text-lg font-bold font-display text-gradient">Shashti Karz</span>
              <p className="text-[10px] lg:text-xs text-[#888] flex items-center gap-1">
                <Sparkles size={10} className="text-[#d4af37]" />
                AI-Powered Admin
              </p>
            </div>
          </Link>
          <button className="lg:hidden p-2 text-[#888]" onClick={() => setMobileMenuOpen?.(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="px-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active
                  ? "bg-gradient-to-r from-[#ff1744]/20 to-[#d4af37]/10 text-white border border-[#ff1744]/30"
                  : "text-[#888] hover:bg-white/5 hover:text-white"
                  }`}
                onClick={() => setMobileMenuOpen?.(false)}
              >
                <item.icon size={18} className={active ? "text-[#ff1744]" : ""} />
                {item.label}
                {item.ai && (
                  <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] bg-[#ff1744]/20 text-[#ff1744]">AI</span>
                )}
                {item.badge && (
                  <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-[#0d0d0d]">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-[#ff1744]/10 to-[#d4af37]/10 text-white border border-white/10 hover:border-[#ff1744]/30 transition-all mb-2"
          >
            <Brain size={18} className="text-[#ff1744]" />
            Ask Shashti AI
          </button>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#888] hover:bg-white/5 hover:text-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen?.(false)}
        />
      )}
    </>
  );
}
