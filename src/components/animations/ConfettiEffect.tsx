"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ConfettiPiece {
    id: number;
    x: number;
    y: number;
    rotation: number;
    color: string;
    size: number;
    velocityX: number;
    velocityY: number;
    rotationSpeed: number;
}

interface ConfettiEffectProps {
    active?: boolean;
    duration?: number;
    colors?: string[];
    pieceCount?: number;
    onComplete?: () => void;
}

export function ConfettiEffect({
    active = false,
    duration = 3000,
    colors = ["#ff1744", "#d4af37", "#4CAF50", "#2196F3", "#FF9800"],
    pieceCount = 50,
    onComplete,
}: ConfettiEffectProps) {
    const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
    const [isActive, setIsActive] = useState(active);

    useEffect(() => {
        if (active && !isActive) {
            setIsActive(true);
            const newPieces: ConfettiPiece[] = Array.from({ length: pieceCount }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: -10,
                rotation: Math.random() * 360,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 10 + 5,
                velocityX: (Math.random() - 0.5) * 2,
                velocityY: Math.random() * 2 + 2,
                rotationSpeed: (Math.random() - 0.5) * 10,
            }));
            setPieces(newPieces);

            const timeout = setTimeout(() => {
                setIsActive(false);
                setPieces([]);
                if (onComplete) onComplete();
            }, duration);

            return () => clearTimeout(timeout);
        }
    }, [active, isActive, duration, colors, pieceCount, onComplete]);

    if (!isActive) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {pieces.map((piece) => (
                <motion.div
                    key={piece.id}
                    className="absolute"
                    style={{
                        left: `${piece.x}%`,
                        top: `${piece.y}%`,
                        width: piece.size,
                        height: piece.size,
                        backgroundColor: piece.color,
                        borderRadius: Math.random() > 0.5 ? "50%" : "0%",
                    }}
                    initial={{
                        y: 0,
                        x: 0,
                        rotate: piece.rotation,
                        opacity: 1,
                    }}
                    animate={{
                        y: window.innerHeight + 100,
                        x: piece.velocityX * 100,
                        rotate: piece.rotation + piece.rotationSpeed * 360,
                        opacity: 0,
                    }}
                    transition={{
                        duration: duration / 1000,
                        ease: "easeIn",
                    }}
                />
            ))}
        </div>
    );
}

export function SuccessConfetti({ trigger }: { trigger: boolean }) {
    return (
        <ConfettiEffect
            active={trigger}
            duration={4000}
            pieceCount={100}
            colors={["#22c55e", "#10b981", "#84cc16", "#fbbf24", "#f59e0b"]}
        />
    );
}

export function CelebrationConfetti({ active }: { active: boolean }) {
    return (
        <ConfettiEffect
            active={active}
            duration={5000}
            pieceCount={150}
            colors={["#ff1744", "#d4af37", "#4CAF50", "#2196F3", "#9C27B0", "#FF9800"]}
        />
    );
}
