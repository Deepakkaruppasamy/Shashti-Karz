"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface BrandedLoaderProps {
    size?: number;
    fullPage?: boolean;
    className?: string; // Add className prop
}

export function BrandedLoader({ size = 120, fullPage = false, className = "" }: BrandedLoaderProps) {
    const loaderContent = (
        <div className={`relative flex flex-col items-center justify-center ${className}`}>

            {/* Logo Container */}
            <div className="relative flex items-center justify-center" style={{ width: size + 40, height: size + 40 }}>

                {/* Rotating Outer Ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border border-transparent border-t-[#ff1744]/60 border-r-[#d4af37]/60"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />

                {/* Counter-Rotating Inner Ring (Subtle) */}
                <motion.div
                    className="absolute inset-2 rounded-full border border-transparent border-b-[#ff1744]/30 border-l-[#d4af37]/30"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                />

                {/* Static Logo with Pulse */}
                <motion.div
                    className="relative z-10"
                    style={{ width: size, height: size }}
                    animate={{
                        scale: [1, 1.05, 1],
                        filter: ["brightness(1)", "brightness(1.1)", "brightness(1)"],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <Image
                        src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/ChatGPT-Image-Dec-8-2025-10_12_14-AM-1-1768823187171.png?width=200&height=200&resize=contain"
                        alt="Shashti Karz Logo Loader"
                        fill
                        className="object-contain"
                        priority
                    />

                    {/* Shimmer Effect */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: "linear-gradient(45deg, transparent, rgba(255,255,255,0.1) 50%, transparent)",
                            backgroundSize: "200% 200%",
                        }}
                        animate={{
                            backgroundPosition: ["0% 0%", "200% 200%"],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                </motion.div>
            </div>

            {/* Loading Text */}
            <motion.p
                className="mt-8 text-[#888] text-[10px] tracking-[0.2em] uppercase font-bold"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                Premium Experience
            </motion.p>
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-[100]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,23,68,0.05)_0%,transparent_70%)]" />
                {loaderContent}
            </div>
        );
    }

    return loaderContent;
}
