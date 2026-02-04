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
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/5 pb-safe-area-inset-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    if (item.isPrimary) {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative -top-5 flex flex-col items-center"
                            >
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center shadow-lg shadow-[#ff1744]/40 border-4 border-[#0a0a0a]">
                                    <Icon className="text-white" size={24} />
                                </div>
                                <span className={cn(
                                    "text-[10px] mt-1 font-medium transition-colors",
                                    isActive ? "text-[#ff1744]" : "text-[#888]"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center w-full h-full relative"
                        >
                            <Icon
                                className={cn(
                                    "transition-colors duration-300",
                                    isActive ? "text-[#ff1744]" : "text-[#888]"
                                )}
                                size={22}
                            />
                            <span className={cn(
                                "text-[10px] mt-1 font-medium transition-colors duration-300",
                                isActive ? "text-[#ff1744]" : "text-[#888]"
                            )}>
                                {item.label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute -top-[1px] w-8 h-[2px] bg-[#ff1744]"
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
