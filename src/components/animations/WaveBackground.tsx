"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface WaveBackgroundProps {
    colors?: string[];
    opacity?: number;
    speed?: number;
    className?: string;
}

export function WaveBackground({
    colors = ["#ff1744", "#d4af37"],
    opacity = 0.1,
    speed = 3,
    className = "",
}: WaveBackgroundProps) {
    return (
        <div className={`absolute inset-0 overflow-hidden ${className}`}>
            <svg
                className="absolute w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
            >
                <motion.path
                    fill={colors[0]}
                    fillOpacity={opacity}
                    d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    animate={{
                        d: [
                            "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                            "M0,160L48,144C96,128,192,96,288,96C384,96,480,128,576,144C672,160,768,160,864,144C960,128,1056,96,1152,96C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                            "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                        ],
                    }}
                    transition={{
                        duration: speed,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <motion.path
                    fill={colors[1]}
                    fillOpacity={opacity * 0.7}
                    d="M0,192L48,176C96,160,192,128,288,128C384,128,480,160,576,176C672,192,768,192,864,176C960,160,1056,128,1152,128C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    animate={{
                        d: [
                            "M0,192L48,176C96,160,192,128,288,128C384,128,480,160,576,176C672,192,768,192,864,176C960,160,1056,128,1152,128C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                            "M0,128L48,144C96,160,192,192,288,192C384,192,480,160,576,144C672,128,768,128,864,144C960,160,1056,192,1152,192C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                            "M0,192L48,176C96,160,192,128,288,128C384,128,480,160,576,176C672,192,768,192,864,176C960,160,1056,128,1152,128C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                        ],
                    }}
                    transition={{
                        duration: speed * 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5,
                    }}
                />
            </svg>
        </div>
    );
}

export function AnimatedGradient({
    colors = ["#ff1744", "#d4af37", "#ff1744"],
    className = "",
}: {
    colors?: string[];
    className?: string;
}) {
    return (
        <motion.div
            className={`absolute inset-0 ${className}`}
            style={{
                background: `linear-gradient(45deg, ${colors.join(", ")})`,
                backgroundSize: "400% 400%",
            }}
            animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear",
            }}
        />
    );
}

export function BlobBackground({
    count = 3,
    colors = ["#ff1744", "#d4af37", "#4CAF50"],
    className = "",
}: {
    count?: number;
    colors?: string[];
    className?: string;
}) {
    const [blobs] = useState(() =>
        Array.from({ length: count }, (_, i) => ({
            id: i,
            color: colors[i % colors.length],
            initialX: Math.random() * 100,
            initialY: Math.random() * 100,
            size: Math.random() * 400 + 200,
        }))
    );

    return (
        <div className={`absolute inset-0 overflow-hidden ${className}`}>
            {blobs.map((blob) => (
                <motion.div
                    key={blob.id}
                    className="absolute rounded-full blur-3xl opacity-20"
                    style={{
                        width: blob.size,
                        height: blob.size,
                        backgroundColor: blob.color,
                        left: `${blob.initialX}%`,
                        top: `${blob.initialY}%`,
                    }}
                    animate={{
                        x: [0, 100, -100, 0],
                        y: [0, -100, 100, 0],
                        scale: [1, 1.2, 0.8, 1],
                    }}
                    transition={{
                        duration: 20 + blob.id * 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
}
