"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Lock, CheckCircle2, Star, Zap, Shield, Sparkles, Trophy } from "lucide-react";

interface Achievement {
    id: string;
    code: string;
    name: string;
    description: string;
    badge_icon: string;
    points: number;
    tier: string;
    category: string;
}

interface UserAchievement {
    achievement: Achievement;
    unlocked_at: string;
}

interface AchievementsDisplayProps {
    userId?: string;
}

export function AchievementsDisplay({ userId }: AchievementsDisplayProps) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [unlocked, setUnlocked] = useState<UserAchievement[]>([]);
    const [points, setPoints] = useState({ total_points: 0, current_level: 1 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        try {
            const response = await fetch("/api/achievements");
            const data = await response.json();

            if (data && !data.error) {
                setAchievements(data.all_achievements || []);
                setUnlocked(data.unlocked || []);
                setPoints(data.points || { total_points: 0, current_level: 1 });
            } else {
                console.warn("Achievement API returned error:", data?.error);
            }
        } catch (error) {
            console.error("Error fetching achievements:", error);
        } finally {
            setLoading(false);
        }
    };

    const isUnlocked = (achievementId: string) => {
        return unlocked.some((ua) => ua.achievement.id === achievementId);
    };

    const getTierConfig = (tier: string) => {
        const configs: Record<string, { color: string; bg: string; border: string; glow: string }> = {
            bronze: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", glow: "shadow-orange-500/20" },
            silver: { color: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/30", glow: "shadow-slate-500/20" },
            gold: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", glow: "shadow-yellow-500/20" },
            platinum: { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", glow: "shadow-purple-500/20" },
            diamond: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", glow: "shadow-blue-500/20" },
        };
        return configs[tier.toLowerCase()] || configs.bronze;
    };

    const getFilteredAchievements = (category: string) => {
        return achievements.filter(a => a.category === category);
    };

    const categories = ["bookings", "loyalty", "social", "eco", "special"];

    if (loading) {
        return (
            <div className="p-8 text-center bg-white/5 rounded-3xl border border-white/10 animate-pulse">
                <div className="w-12 h-12 bg-white/10 rounded-full mx-auto mb-4" />
                <div className="h-4 w-32 bg-white/10 mx-auto rounded" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header / Level Progress */}
            <div className="relative overflow-hidden rounded-[2.5rem] p-8 glass-card border-none bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]">
                <div className="absolute top-0 right-0 p-12 -mr-12 -mt-12 bg-[#ff1744]/10 blur-[80px] rounded-full" />
                <div className="absolute bottom-0 left-0 p-12 -ml-12 -mb-12 bg-[#d4af37]/10 blur-[80px] rounded-full" />

                <div className="relative flex flex-col md:flex-row items-center gap-8 justify-between">
                    <div className="flex items-center gap-6 text-center md:text-left">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center text-4xl shadow-2xl shadow-[#ff1744]/20 rotate-3">
                                <Trophy className="text-white" size={40} />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-white text-black px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter">
                                Lvl {points.current_level}
                            </div>
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-white tracking-tight italic uppercase">
                                Achievement <span className="text-[#ff1744]">Vault</span>
                            </h2>
                            <p className="text-[#888] font-medium tracking-wide">
                                You have earned <span className="text-white font-bold">{points.total_points}</span> loyalty points
                            </p>
                        </div>
                    </div>

                    <div className="w-full md:w-64 space-y-3">
                        <div className="flex justify-between text-xs font-black uppercase tracking-[0.2em] text-[#666]">
                            <span>Gallery Progress</span>
                            <span className="text-white">{unlocked.length} / {achievements.length}</span>
                        </div>
                        <div className="h-4 bg-white/5 rounded-full p-1 border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(unlocked.length / achievements.length) * 100}%` }}
                                className="h-full rounded-full bg-gradient-to-r from-[#ff1744] to-[#d4af37] shadow-[0_0_15px_rgba(255,23,68,0.3)]"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {achievements.map((achievement, index) => {
                        const unlocked_item = isUnlocked(achievement.id);
                        const config = getTierConfig(achievement.tier);

                        return (
                            <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`group relative p-6 rounded-[2rem] border transition-all duration-500 overflow-hidden ${unlocked_item
                                        ? `glass-card ${config.border} ${config.glow} scale-100`
                                        : "bg-white/[0.02] border-white/5 opacity-60 grayscale hover:grayscale-0"
                                    }`}
                            >
                                {/* Background Icon Watermark */}
                                <div className="absolute -right-4 -bottom-4 text-white/[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                    <span className="text-9xl tracking-tighter select-none">{achievement.badge_icon}</span>
                                </div>

                                <div className="relative flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 ${unlocked_item ? config.bg : "bg-white/5"
                                            }`}>
                                            {achievement.badge_icon}
                                        </div>
                                        {unlocked_item ? (
                                            <div className="bg-green-500/20 text-green-500 p-1.5 rounded-full">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        ) : (
                                            <div className="bg-white/5 text-white/20 p-1.5 rounded-full">
                                                <Lock size={16} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${config.bg} ${config.border} ${config.color}`}>
                                                {achievement.tier}
                                            </span>
                                            <span className="text-[10px] font-bold text-[#666] uppercase tracking-widest">
                                                {achievement.category}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-black text-white tracking-tight group-hover:text-[#ff1744] transition-colors">
                                            {achievement.name}
                                        </h3>
                                        <p className="text-sm text-[#888] font-medium leading-snug mt-2">
                                            {achievement.description}
                                        </p>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <Zap size={14} className="text-[#d4af37]" />
                                            <span className="text-sm font-black text-white">+{achievement.points} <span className="text-[10px] text-[#666] uppercase font-bold tracking-widest ml-1">Pts</span></span>
                                        </div>
                                        {unlocked_item && (
                                            <span className="text-[10px] font-black text-green-500/80 uppercase tracking-tighter">
                                                Unlocked
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
