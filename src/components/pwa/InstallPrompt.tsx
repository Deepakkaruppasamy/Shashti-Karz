"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (typeof window !== "undefined") {
            if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
                setIsInstalled(true);
                return;
            }
        }

        // Listen for install prompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            
            // Show prompt after a short delay
            const dismissed = localStorage.getItem("pwa-prompt-dismissed");
            if (!dismissed) {
                setTimeout(() => setShowPrompt(true), 5000);
            }
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Listen for successful install
        window.addEventListener("appinstalled", () => {
            setIsInstalled(true);
            setShowPrompt(false);
            localStorage.setItem("pwa-installed", "true");
        });

        // Show generic prompt on desktop after 10s if not installed
        const timer = setTimeout(() => {
            const dismissed = localStorage.getItem("pwa-prompt-dismissed");
            if (!isInstalled && !dismissed && !deferredPrompt) {
                setShowPrompt(true);
            }
        }, 15000);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
            clearTimeout(timer);
        };
    }, [isInstalled, deferredPrompt]);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setShowPrompt(false);
            }
            setDeferredPrompt(null);
        } else {
            // Probably on desktop or iOS where native prompt isn't supported via API
            setShowQR(true);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("pwa-prompt-dismissed", "true");
    };

    if (isInstalled) return null;

    return (
        <>
            <AnimatePresence>
                {showPrompt && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        className="fixed bottom-20 lg:bottom-8 right-4 left-4 lg:left-auto lg:w-96 z-[100]"
                    >
                        <div className="bg-[#111] border border-[#ff1744]/30 rounded-2xl shadow-2xl overflow-hidden shadow-[#ff1744]/10">
                            <div className="relative p-5">
                                <button
                                    onClick={handleDismiss}
                                    className="absolute top-3 right-3 text-[#666] hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center shrink-0 shadow-lg shadow-[#ff1744]/20">
                                        <Smartphone className="text-white" size={24} />
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-white font-bold text-base mb-1">
                                            Install Shashti Karz App
                                        </h3>
                                        <p className="text-[#888] text-xs mb-4 leading-relaxed">
                                            Book faster, get live updates, and enjoy 5% off your first app booking!
                                        </p>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleInstall}
                                                className="flex-1 bg-white text-black text-xs font-bold py-2.5 px-4 rounded-lg hover:bg-[#eee] transition-all flex items-center justify-center gap-2"
                                            >
                                                <Download size={14} />
                                                Install App
                                            </button>
                                            <button
                                                onClick={() => setShowQR(true)}
                                                className="p-2.5 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                                                title="Scan QR"
                                            >
                                                <QrCode size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Accent line */}
                            <div className="h-1 w-full bg-gradient-to-r from-[#ff1744] via-[#d4af37] to-[#ff1744]" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* QR Code Modal */}
            <AnimatePresence>
                {showQR && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-sm w-full relative text-center"
                        >
                            <button
                                onClick={() => setShowQR(false)}
                                className="absolute top-4 right-4 text-[#666] hover:text-white"
                            >
                                <X size={24} />
                            </button>

                            <div className="mb-6">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#ff1744]/20">
                                    <QrCode size={40} className="text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Scan to Install</h3>
                                <p className="text-[#888] text-sm">Scan this QR code with your phone camera to open and install the Shashti Karz app.</p>
                            </div>

                            <div className="bg-white p-4 rounded-2xl inline-block mb-6 shadow-2xl">
                                <img 
                                    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://shashtikarz.com&color=000000" 
                                    alt="Scan to install" 
                                    className="w-48 h-48"
                                />
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs text-[#666] uppercase font-bold tracking-widest">Available on</p>
                                <div className="flex justify-center gap-4 text-[#888]">
                                    <div className="flex items-center gap-1.5 grayscale opacity-50">
                                        <Smartphone size={16} />
                                        <span className="text-[10px] font-bold">iOS</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Smartphone size={16} className="text-green-500" />
                                        <span className="text-[10px] font-bold text-white">ANDROID</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
