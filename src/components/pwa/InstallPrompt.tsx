"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }

        // Listen for install prompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show prompt after 30 seconds
            setTimeout(() => {
                const dismissed = localStorage.getItem("pwa-prompt-dismissed");
                if (!dismissed) {
                    setShowPrompt(true);
                }
            }, 30000);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Listen for successful install
        window.addEventListener("appinstalled", () => {
            setIsInstalled(true);
            setShowPrompt(false);

            // Track install
            fetch("/api/pwa/install", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    install_source: "prompt",
                    device_info: {
                        userAgent: navigator.userAgent,
                        platform: navigator.platform,
                    },
                }),
            });
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setShowPrompt(false);
        }

        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("pwa-prompt-dismissed", "true");
    };

    if (isInstalled || !showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
            >
                <div className="bg-gradient-to-br from-[#ff1744] to-[#d4af37] p-6 rounded-2xl shadow-2xl">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-2 right-2 text-white/80 hover:text-white"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="bg-white/20 p-3 rounded-xl">
                            <Smartphone className="text-white" size={32} />
                        </div>

                        <div className="flex-1">
                            <h3 className="text-white font-bold text-lg mb-2">
                                Install Shashti Karz App
                            </h3>
                            <p className="text-white/90 text-sm mb-4">
                                Get faster access, offline booking, and push notifications. Install our app for the best experience!
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleInstall}
                                    className="flex-1 bg-white text-[#ff1744] font-semibold py-2 px-4 rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download size={18} />
                                    Install Now
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="px-4 py-2 text-white/90 hover:text-white transition-colors"
                                >
                                    Later
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
