"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import VideoPromoPlayer from "./VideoPromoPlayer";
import { Ad } from "@/lib/types";

interface InterstitialProps {
    position: string;
}

export default function InterstitialVideoPromo({ position }: InterstitialProps) {
    const [ad, setAd] = useState<Ad | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const checkAd = async () => {
            // Frequency capping: check session storage
            if (sessionStorage.getItem(`seen_ad_${position}`)) return;

            try {
                const res = await fetch(`/api/ads/delivery?position=${position}`);
                const data = await res.json();

                if (data.ad) {
                    setAd(data.ad);
                    // Small delay before showing to not jar the user immediately on load
                    setTimeout(() => setIsVisible(true), 2000);

                    // Track Impression
                    fetch('/api/ads/track', {
                        method: 'POST',
                        body: JSON.stringify({ adId: data.ad.id, eventType: 'impression' })
                    });
                }
            } catch (e) {
                console.error("Failed to load interstitial", e);
            }
        };

        checkAd();
    }, [position]);

    const handleClose = () => {
        setIsVisible(false);
        sessionStorage.setItem(`seen_ad_${position}`, 'true');
    };

    if (!ad || !isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-5xl"
                    >
                        <VideoPromoPlayer
                            mediaUrl={ad.media_url || ""}
                            thumbnailUrl={ad.thumbnail_url}
                            title={ad.title}
                            description={ad.description}
                            targetUrl={ad.target_url}
                            position="popup"
                            onClose={handleClose}
                            autoPlay={true}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
