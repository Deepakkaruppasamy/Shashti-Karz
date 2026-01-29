"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ReactNode, useRef, MouseEvent } from "react";

interface LiquidButtonProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "gradient";
}

export function LiquidButton({
    children,
    className = "",
    onClick,
    variant = "primary",
}: LiquidButtonProps) {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7.5deg", "-7.5deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7.5deg", "7.5deg"]);

    const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
        if (!buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const variants = {
        primary: "bg-gradient-to-r from-[#ff1744] to-[#ff4081]",
        secondary: "bg-gradient-to-r from-[#d4af37] to-[#ffd700]",
        gradient: "bg-gradient-to-r from-[#ff1744] via-[#ff4081] to-[#d4af37]",
    };

    return (
        <motion.button
            ref={buttonRef}
            className={`relative overflow-hidden rounded-full px-8 py-4 font-semibold text-white transition-all ${variants[variant]} ${className}`}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Liquid blob effect */}
            <motion.div
                className="absolute inset-0 opacity-50"
                style={{
                    background: "radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%)",
                    x: mouseX,
                    y: mouseY,
                }}
            />

            {/* Ripple effect */}
            <motion.div
                className="absolute inset-0"
                initial={false}
                whileTap={{
                    scale: [1, 2.5],
                    opacity: [0.5, 0],
                }}
                transition={{ duration: 0.6 }}
                style={{
                    background: "radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)",
                }}
            />

            {/* Shimmer effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                    x: ["-100%", "100%"],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />

            {/* Content */}
            <span className="relative z-10">{children}</span>
        </motion.button>
    );
}

export function LiquidButtonSimple({
    children,
    className = "",
    onClick,
}: Omit<LiquidButtonProps, "variant">) {
    return (
        <motion.button
            className={`relative overflow-hidden rounded-full px-8 py-4 font-semibold text-white bg-gradient-to-r from-[#ff1744] to-[#d4af37] ${className}`}
            onClick={onClick}
            whileHover={{
                scale: 1.05,
                boxShadow: "0 0 30px rgba(255, 23, 68, 0.5)",
            }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Wave animation */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#ff1744]"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
            />

            {/* Content */}
            <span className="relative z-10">{children}</span>
        </motion.button>
    );
}
