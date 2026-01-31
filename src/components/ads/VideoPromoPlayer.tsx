"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, ExternalLink, X } from "lucide-react";

interface VideoPromoProps {
    mediaUrl: string;
    thumbnailUrl?: string;
    title: string;
    description?: string;
    ctaText?: string;
    targetUrl?: string;
    position: "hero" | "sidebar" | "popup";
    onClose?: () => void;
    autoPlay?: boolean;
}

export default function VideoPromoPlayer({
    mediaUrl,
    thumbnailUrl,
    title,
    description,
    ctaText = "Learn More",
    targetUrl,
    position,
    onClose,
    autoPlay = true
}: VideoPromoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (videoRef.current) {
            if (autoPlay) { videoRef.current.play().catch(() => {/* Auto-play prevented */ }); }
        }
    }, [autoPlay]);

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(progress);
        }
    };

    const isHero = position === "hero";
    const isPopup = position === "popup";

    // Different styles based on position
    const containerClasses = isHero
        ? "relative w-full h-[500px] overflow-hidden rounded-3xl group"
        : isPopup
            ? "relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
            : "relative w-full aspect-[9/16] rounded-xl overflow-hidden group shadow-lg"; // Sidebar/Vertical

    return (
        <div className={containerClasses}>
            <video
                ref={videoRef}
                src={mediaUrl}
                poster={thumbnailUrl}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onClick={() => {
                    if (targetUrl) window.open(targetUrl, "_blank");
                }}
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 flex flex-col items-start gap-4">
                <div className="space-y-2 max-w-lg">
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`font-black text-white ${isHero ? "text-4xl md:text-5xl" : "text-2xl"}`}
                    >
                        {title}
                    </motion.h3>
                    {description && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-200 text-sm md:text-base line-clamp-2"
                        >
                            {description}
                        </motion.p>
                    )}
                </div>

                <div className="flex items-center gap-4 pointer-events-auto">
                    {targetUrl && (
                        <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {ctaText} <ExternalLink size={16} />
                        </a>
                    )}
                    <button
                        onClick={toggleMute}
                        className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors"
                    >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
                <div
                    className="h-full bg-purple-500 transition-all duration-100 linear"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {isPopup && onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-20"
                >
                    <X size={24} />
                </button>
            )}
        </div>
    );
}
