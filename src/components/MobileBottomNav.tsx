"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Car, Calendar, User, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Services", icon: Car, href: "/services" },
    { label: "Book", icon: Calendar, href: "/booking", isPrimary: true },
    { label: "Support", icon: MessageCircle, href: "/contact" },
    { label: "Profile", icon: User, href: "/dashboard" },
];

export function MobileBottomNav() {
    const pathname = usePathname();

    return (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-[400px]">
            <div className="bg-[#111]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] h-18 px-4 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {navItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    if (item.isPrimary) {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative -top-6"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center shadow-[0_15px_30px_rgba(255,23,68,0.4)] border-4 border-[#0a0a0a]"
                                >
                                    <Icon className="text-white" size={28} />
                                </motion.div>
                                <motion.span
                                    initial={false}
                                    animate={{ opacity: isActive ? 1 : 0.6, y: isActive ? 0 : 2 }}
                                    className={cn(
                                        "absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-tighter",
                                        isActive ? "text-[#ff1744]" : "text-[#888]"
                                    )}
                                >
                                    {item.label}
                                </motion.span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center p-2 relative group"
                        >
                            <motion.div
                                whileTap={{ scale: 0.8 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                                <Icon
                                    className={cn(
                                        "transition-all duration-300",
                                        isActive ? "text-white" : "text-[#666] group-hover:text-[#aaa]"
                                    )}
                                    size={22}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </motion.div>
                            <span className={cn(
                                "text-[9px] mt-1 font-bold uppercase tracking-tight transition-all duration-300",
                                isActive ? "text-white opacity-100" : "text-[#666] opacity-0 group-hover:opacity-60"
                            )}>
                                {item.label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabGlow"
                                    className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-[#ff1744] shadow-[0_0_10px_#ff1744]"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
