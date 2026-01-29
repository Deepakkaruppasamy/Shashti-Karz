"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ReactNode, useRef, MouseEvent, useState } from "react";

interface MorphingCardProps {
    children: ReactNode;
    className?: string;
    hoverScale?: number;
    tiltIntensity?: number;
    glowColor?: string;
}

export function MorphingCard({
    children,
    className = "",
    hoverScale = 1.02,
    tiltIntensity = 10,
    glowColor = "rgba(255, 23, 68, 0.3)",
}: MorphingCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], [`${tiltIntensity}deg`, `-${tiltIntensity}deg`]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [`-${tiltIntensity}deg`, `${tiltIntensity}deg`]);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
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

    return (
        <motion.div
            ref={cardRef}
            className={`relative ${className}`}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{
                scale: hoverScale,
                boxShadow: `0 20px 60px ${glowColor}`,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {/* Glow effect */}
            <motion.div
                className="absolute inset-0 rounded-2xl opacity-0"
                style={{
                    background: `radial-gradient(circle at ${mouseX}px ${mouseY}px, ${glowColor}, transparent 70%)`,
                }}
                whileHover={{ opacity: 1 }}
            />

            {/* Content */}
            <div style={{ transform: "translateZ(50px)" }}>{children}</div>
        </motion.div>
    );
}

export function FlipCard({
    front,
    back,
    className = "",
}: {
    front: ReactNode;
    back: ReactNode;
    className?: string;
}) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div className={`relative ${className}`} style={{ perspective: "1000px" }}>
            <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring" }}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                {/* Front */}
                <div
                    className="absolute inset-0 backface-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    {front}
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 backface-hidden"
                    style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                    }}
                >
                    {back}
                </div>
            </motion.div>
        </div>
    );
}

export function ExpandCard({
    children,
    expandedContent,
    className = "",
}: {
    children: ReactNode;
    expandedContent: ReactNode;
    className?: string;
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            className={`relative overflow-hidden ${className}`}
            layout
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ scale: 1.02 }}
            transition={{ layout: { duration: 0.4, type: "spring" } }}
        >
            <motion.div layout="position">{children}</motion.div>

            {isExpanded && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {expandedContent}
                </motion.div>
            )}
        </motion.div>
    );
}

export function MorphingShape({
    shapes = ["circle", "square", "triangle"],
    className = "",
    size = 100,
    color = "#ff1744",
}: {
    shapes?: string[];
    className?: string;
    size?: number;
    color?: string;
}) {
    const [currentShape, setCurrentShape] = useState(0);

    const shapeVariants = {
        circle: {
            borderRadius: "50%",
            rotate: 0,
        },
        square: {
            borderRadius: "0%",
            rotate: 0,
        },
        triangle: {
            borderRadius: "0%",
            rotate: 45,
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
        },
        star: {
            borderRadius: "0%",
            rotate: 0,
            clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
        },
    };

    return (
        <motion.div
            className={`cursor-pointer ${className}`}
            style={{
                width: size,
                height: size,
                backgroundColor: color,
            }}
            animate={shapeVariants[shapes[currentShape] as keyof typeof shapeVariants]}
            onClick={() => setCurrentShape((prev) => (prev + 1) % shapes.length)}
            transition={{ duration: 0.6, type: "spring" }}
            whileHover={{ scale: 1.1 }}
        />
    );
}
