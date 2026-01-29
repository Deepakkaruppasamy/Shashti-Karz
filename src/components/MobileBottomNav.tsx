"use client";

import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Users, Settings, Package } from "lucide-react";
import { motion } from "framer-motion";

interface NavItem {
    id: string;
    label: string;
    icon: any;
    href: string;
}

const mobileNavItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { id: "bookings", label: "Bookings", icon: Calendar, href: "/admin?tab=bookings" },
    { id: "inventory", label: "Inventory", icon: Package, href: "/admin/inventory" },
    { id: "users", label: "Users", icon: Users, href: "/admin?tab=users" },
    { id: "settings", label: "Settings", icon: Settings, href: "/admin/settings" },
];

export function MobileBottomNav() {
    const router = useRouter();
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href) || href.includes(pathname);
    };

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d0d]/95 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {mobileNavItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <button
                            key={item.id}
                            onClick={() => router.push(item.href)}
                            className="flex flex-col items-center justify-center flex-1 h-full relative"
                        >
                            {active && (
                                <motion.div
                                    layoutId="mobile-nav-indicator"
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-[#ff1744] to-[#d4af37] rounded-full"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                            <div
                                className={`flex flex-col items-center gap-1 transition-all ${active ? "text-white scale-110" : "text-[#888] scale-100"
                                    }`}
                            >
                                <item.icon
                                    size={20}
                                    className={active ? "text-[#ff1744]" : ""}
                                />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
