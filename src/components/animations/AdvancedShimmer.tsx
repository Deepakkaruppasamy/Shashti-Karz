"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ShimmerEffectProps {
    children: ReactNode;
    className?: string;
    shimmerColor?: string;
    duration?: number;
    delay?: number;
}

export function ShimmerEffect({
    children,
    className = "",
    shimmerColor = "rgba(255, 255, 255, 0.3)",
    duration = 2,
    delay = 0,
}: ShimmerEffectProps) {
    return (
        <div className={`relative overflow-hidden ${className}`}>
            {children}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `linear-gradient(90deg, transparent 0%, ${shimmerColor} 50%, transparent 100%)`,
                }}
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{
                    duration,
                    delay,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />
        </div>
    );
}

export function ShimmerCard({
    children,
    className = "",
    hoverOnly = false,
}: {
    children: ReactNode;
    className?: string;
    hoverOnly?: boolean;
}) {
    return (
        <motion.div
            className={`relative overflow-hidden rounded-2xl ${className}`}
            whileHover={
                hoverOnly
                    ? {
                        boxShadow: "0 0 30px rgba(255, 23, 68, 0.3)",
                    }
                    : undefined
            }
        >
            {children}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        "linear-gradient(110deg, transparent 40%, rgba(255, 255, 255, 0.1) 50%, transparent 60%)",
                }}
                initial={hoverOnly ? { x: "-100%" } : { x: "-100%" }}
                animate={hoverOnly ? {} : { x: "200%" }}
                whileHover={hoverOnly ? { x: "200%" } : undefined}
                transition={
                    hoverOnly
                        ? { duration: 0.6, ease: "easeInOut" }
                        : {
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                        }
                }
            />
        </motion.div>
    );
}

export function ShimmerSkeleton({
    width = "100%",
    height = "20px",
    className = "",
    rounded = "md",
}: {
    width?: string;
    height?: string;
    className?: string;
    rounded?: "sm" | "md" | "lg" | "full";
}) {
    const roundedClasses = {
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
    };

    return (
        <div
            className={`relative overflow-hidden bg-white/5 ${roundedClasses[rounded]} ${className}`}
            style={{ width, height }}
        >
            <motion.div
                className="absolute inset-0"
                style={{
                    background:
                        "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
                }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />
        </div>
    );
}

export function ShimmerText({
    children,
    className = "",
    gradient = "from-[#ff1744] via-[#ff4081] to-[#d4af37]",
}: {
    children: ReactNode;
    className?: string;
    gradient?: string;
}) {
    return (
        <motion.span
            className={`relative inline-block ${className}`}
            style={{
                background: `linear-gradient(90deg, var(--tw-gradient-stops))`,
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
            }}
            animate={{
                backgroundPosition: ["0% 50%", "200% 50%"],
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
            }}
        >
            <span className={`bg-gradient-to-r ${gradient}`}>{children}</span>
        </motion.span>
    );
}

export function ShimmerBorder({
    children,
    className = "",
    borderWidth = 2,
    colors = ["#ff1744", "#d4af37", "#ff1744"],
}: {
    children: ReactNode;
    className?: string;
    borderWidth?: number;
    colors?: string[];
}) {
    return (
        <div className={`relative ${className}`}>
            <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{
                    padding: borderWidth,
                    background: `linear-gradient(90deg, ${colors.join(", ")})`,
                    backgroundSize: "200% 100%",
                }}
                animate={{
                    backgroundPosition: ["0% 50%", "200% 50%"],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                }}
            >
                <div className="w-full h-full bg-[#0a0a0a] rounded-2xl">{children}</div>
            </motion.div>
        </div>
    );
}
