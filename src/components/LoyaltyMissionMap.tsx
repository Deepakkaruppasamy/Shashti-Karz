"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield,
    Compass,
    Award,
    Crown,
    Star,
    CheckCircle2,
    Lock,
    Sparkles,
    Zap,
    ChevronRight
} from "lucide-react";

interface LoyaltyMissionMapProps {
    currentPoints: number;
}

const MISSIONS = [
    {
        id: "scout",
        name: "Scout",
        threshold: 0,
        description: "The journey begins. Exploring the detailing horizon.",
        icon: Compass,
        color: "#4CAF50",
        gradient: "from-green-500 to-emerald-500",
        benefit: "5% Discount on all washes"
    },
    {
        id: "veteran",
        name: "Veteran",
        threshold: 500,
        description: "Battle-hardened. A true connoisseur of vehicle gloss.",
        icon: Shield,
        color: "#2196F3",
        gradient: "from-blue-500 to-indigo-500",
        benefit: "Free Interior Vacuuming"
    },
    {
        id: "elite",
        name: "Elite",
        threshold: 1500,
        description: "The Golden Standard. Reserved for dedicated owners.",
        icon: Award,
        color: "#9C27B0",
        gradient: "from-purple-500 to-pink-500",
        benefit: "15% Off Ceramic Protection"
    },
    {
        id: "legendary",
        name: "Legendary",
        threshold: 3500,
        description: "Eternal Shine. Part of the Shashti Council.",
        icon: Crown,
        color: "#d4af37",
        gradient: "from-[#d4af37] to-[#ffd700]",
        benefit: "VIP Priority Scheduling"
    }
];

export const LoyaltyMissionMap: React.FC<LoyaltyMissionMapProps> = ({ currentPoints }) => {
    const currentMissionIndex = useMemo(() => {
        for (let i = MISSIONS.length - 1; i >= 0; i--) {
            if (currentPoints >= MISSIONS[i].threshold) return i;
        }
        return 0;
    }, [currentPoints]);

    const nextMission = MISSIONS[currentMissionIndex + 1] || null;
    const progressToNext = nextMission
        ? ((currentPoints - MISSIONS[currentMissionIndex].threshold) / (nextMission.threshold - MISSIONS[currentMissionIndex].threshold)) * 100
        : 100;

    return (
        <div className="relative w-full py-12 px-4 overflow-hidden">
            {/* Background Decorative Path */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 hidden md:block" />

            {/* Mission Nodes */}
            <div className="relative flex flex-col md:flex-row justify-between items-center gap-12 md:gap-4 z-10">
                {MISSIONS.map((mission, index) => {
                    const isAchieved = currentPoints >= mission.threshold;
                    const isCurrent = currentMissionIndex === index;
                    const isNext = nextMission?.id === mission.id;

                    return (
                        <div key={mission.id} className="relative flex flex-col items-center">
                            {/* Connection Line (Mobile) */}
                            {index < MISSIONS.length - 1 && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-12 bg-white/5 md:hidden" />
                            )}

                            {/* Path Progress (Desktop) */}
                            {index < MISSIONS.length - 1 && (
                                <div className="absolute top-1/2 left-full w-full h-1 bg-white/5 -translate-y-1/2 hidden md:block origin-left">
                                    {isAchieved && (
                                        <motion.div
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: index < currentMissionIndex ? 1 : progressToNext / 100 }}
                                            className={`h-full bg-gradient-to-r ${mission.gradient} origin-left`}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Node Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative group cursor-help`}
                            >
                                {/* Outer Glow */}
                                <AnimatePresence>
                                    {(isAchieved || isCurrent) && (
                                        <motion.div
                                            layoutId="glow"
                                            className={`absolute -inset-4 bg-gradient-to-br ${mission.gradient} opacity-20 blur-2xl rounded-full`}
                                            animate={isCurrent ? { scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] } : {}}
                                            transition={{ duration: 4, repeat: Infinity }}
                                        />
                                    )}
                                </AnimatePresence>

                                {/* Central Icon */}
                                <div className={`relative w-20 h-20 lg:w-24 lg:h-24 rounded-[2rem] flex items-center justify-center border-2 transition-all duration-500 shadow-2xl ${isAchieved
                                    ? `bg-black/40 border-${mission.color}/30 text-white`
                                    : "bg-black/20 border-white/5 text-white/20"
                                    } ${isCurrent ? "scale-110 -translate-y-2 border-[#ff1744]/50" : ""}`}>

                                    {/* Glass Background */}
                                    <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-xl rounded-[2rem]" />

                                    <mission.icon size={isCurrent ? 40 : 32} className={`relative z-10 transition-colors ${isAchieved ? "text-white" : "text-white/20"}`} />

                                    {/* Status Indicator */}
                                    <div className="absolute -top-2 -right-2 z-20">
                                        {isAchieved ? (
                                            <div className="p-1.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50">
                                                <CheckCircle2 size={12} className="text-white" />
                                            </div>
                                        ) : (
                                            <div className="p-1.5 rounded-full bg-white/10 backdrop-blur-md">
                                                <Lock size={12} className="text-white/40" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Achievement Particle Effects (Current Only) */}
                                    {isCurrent && (
                                        <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                                            <motion.div
                                                animate={{ x: ["-100%", "100%"] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Tooltip Content */}
                                <div className="mt-6 text-center">
                                    <h4 className={`text-sm lg:text-base font-black italic uppercase tracking-tighter ${isAchieved ? "text-white" : "text-[#444]"}`}>
                                        {mission.name}
                                    </h4>
                                    <p className="text-[10px] font-bold text-[#666] uppercase tracking-widest mt-1">
                                        {mission.threshold} PTS
                                    </p>
                                </div>

                                {/* Benefit Badge (Hover) */}
                                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    <div className="glass-card p-3 rounded-xl border border-white/10 shadow-2xl text-center">
                                        <p className="text-[8px] font-black text-[#666] uppercase mb-1">UNLOCKED PERK</p>
                                        <p className="text-[10px] font-bold text-white">{mission.benefit}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    );
                })}
            </div>

            {/* Current Progress HUD */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-16 lg:mt-24 glass-card rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 p-8">
                    <Zap size={32} className="text-[#ff1744] animate-pulse" />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-end gap-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={16} className="text-[#d4af37]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#888]">Mission Status Dashboard</span>
                        </div>
                        <h3 className="text-3xl lg:text-5xl font-black italic tracking-tighter uppercase mb-4">
                            Rank: <span className="text-gradient">{MISSIONS[currentMissionIndex].name}</span>
                        </h3>
                        <p className="text-[#888] text-sm max-w-md font-medium leading-relaxed italic">
                            "{MISSIONS[currentMissionIndex].description}"
                        </p>
                    </div>

                    <div className="w-full md:w-80 text-right">
                        {nextMission ? (
                            <>
                                <div className="flex justify-between items-end mb-3">
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-[#444] uppercase tracking-widest">Next Evolution</p>
                                        <p className="text-lg font-black italic tracking-tight">{nextMission.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black italic tracking-tighter text-[#ff1744]">-{nextMission.threshold - currentPoints}</p>
                                        <p className="text-[8px] font-black text-[#444] uppercase tracking-widest">Points to go</p>
                                    </div>
                                </div>
                                <div className="h-2 rounded-full bg-white/5 border border-white/5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressToNext}%` }}
                                        className={`h-full bg-gradient-to-r ${MISSIONS[currentMissionIndex].gradient}`}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="text-center md:text-right">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] font-black text-[10px] uppercase tracking-[0.2em]">
                                    Ultimate Rank Achieved
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <button className="btn-premium px-8 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#ff1744]/20">
                        <Star size={18} /> Points Dynamics
                    </button>
                    <button className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3">
                        Mission Ledger <ChevronRight size={16} />
                    </button>
                </div>

                {/* Floating Icons Decor */}
                <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
                    <Crown size={200} />
                </div>
            </motion.div>
        </div>
    );
};
