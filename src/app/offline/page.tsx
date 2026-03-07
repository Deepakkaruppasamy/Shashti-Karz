"use client";
import React, { useState, useEffect } from "react";
import { WifiOff, Home, RefreshCcw, Shield, Activity, Zap, Cpu, SignalHigh } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function OfflinePage() {
    const [reconStatus, setReconStatus] = useState("SCANNING_SIGNAL");
    const [cachedOperations, setCachedOperations] = useState(3);

    useEffect(() => {
        const statuses = ["ANALYZING_SPECTRUM", "VECTORS_STABLE", "SEEKING_IP_UPLINK", "SCANNING_SIGNAL"];
        let i = 0;
        const interval = setInterval(() => {
            setReconStatus(statuses[i % statuses.length]);
            i++;
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#060606] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* HUD Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff1744]/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
            </div>

            {/* Signal Recon HUD */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-lg"
            >
                <div className="glass-card rounded-[2.5rem] p-8 lg:p-12 border border-[#ff1744]/20 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8">
                        <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="flex items-center gap-1.5"
                        >
                            <div className="w-1 h-3 bg-[#444] rounded-full" />
                            <div className="w-1 h-5 bg-[#444] rounded-full" />
                            <div className="w-1 h-7 bg-[#444] rounded-full" />
                            <div className="w-1 h-9 bg-[#444] rounded-full" />
                        </motion.div>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-[#ff1744]/20 blur-3xl rounded-full" />
                            <motion.div
                                animate={{
                                    boxShadow: ["0 0 0 0 rgba(255, 23, 68, 0.2)", "0 0 0 20px rgba(255, 23, 68, 0)"]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="relative w-24 h-24 rounded-[2rem] bg-white/[0.03] border border-white/10 flex items-center justify-center"
                            >
                                <WifiOff size={44} className="text-[#ff1744]" />
                            </motion.div>
                        </div>

                        <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Signal <span className="text-[#ff1744]">Severed</span></h1>
                        <p className="text-[10px] font-black text-[#ff1744] uppercase tracking-[0.4em] mb-8 animate-pulse">
                            {reconStatus}
                        </p>

                        <div className="w-full space-y-4 mb-10">
                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#d4af37]">
                                        <Shield size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#555]">Mission Integrity</p>
                                        <p className="text-sm font-bold">Continuity Protocol Active</p>
                                    </div>
                                </div>
                                <div className="text-[8px] font-black px-2 py-1 bg-green-500/10 text-green-500 rounded border border-green-500/20 uppercase tracking-tighter">SECURED</div>
                            </div>

                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#ff1744]">
                                        <Cpu size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#555]">Sync Queue</p>
                                        <p className="text-sm font-bold">{cachedOperations} Operations Buffered</p>
                                    </div>
                                </div>
                                <Zap size={16} className="text-[#ff1744] animate-bounce" />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 btn-premium px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 justify-center shadow-xl shadow-[#ff1744]/20"
                            >
                                <RefreshCcw size={16} className="animate-spin-slow" />
                                Force Recon
                            </button>
                            <Link
                                href="/"
                                className="flex-1 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-3 justify-center"
                            >
                                <Home size={16} />
                                Return Base
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-center gap-8 opacity-20">
                    <div className="flex flex-col items-center">
                        <div className="text-xs font-black uppercase tracking-widest">Latency</div>
                        <div className="text-xl font-black italic tracking-tighter">--ms</div>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <div className="flex flex-col items-center">
                        <div className="text-xs font-black uppercase tracking-widest">Uplink</div>
                        <div className="text-xl font-black italic tracking-tighter">OFFLINE</div>
                    </div>
                </div>
            </motion.div>

            {/* Footer Tag */}
            <div className="absolute bottom-10 text-[9px] font-black uppercase tracking-[0.5em] text-[#333]">
                SHASHTI KARZ // OPERATIONAL_CONTINUITY_MODULE_v3.01
            </div>
        </div>
    );
}
