"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface BrandedLoaderProps {
    size?: number;
    fullPage?: boolean;
    className?: string;
}

export function BrandedLoader({ size = 120, fullPage = false, className = "" }: BrandedLoaderProps) {
    const loaderContent = (
        <div className={`relative flex flex-col items-center justify-center ${className}`}>
            {/* Animated Container for Logo */}
            <motion.div
                animate={{
                    rotate: 360,
                    scale: [1, 1.05, 1],
                }}
                transition={{
                    rotate: {
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear",
                    },
                    scale: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    },
                }}
                className="relative"
                style={{ width: size, height: size }}
            >
                <Image
                    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/ChatGPT-Image-Dec-8-2025-10_12_14-AM-1-1768823187171.png?width=200&height=200&resize=contain"
                    alt="Shashti Karz Logo Loader"
                    fill
                    className="object-contain"
                    priority
                />

                {/* Premium Shimmer Overlay */}
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
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            </motion.div>

            {/* Loading Text */}
            <motion.p
                className="mt-6 text-[#888] text-[10px] tracking-[0.2em] uppercase font-bold"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                Premium Experience
            </motion.p>

            {/* Progress Bar (purely aesthetic for branding) */}
            <div className="mt-4 w-32 h-[1px] bg-white/5 relative overflow-hidden">
                <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-[#ff1744] to-transparent w-full"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>
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
