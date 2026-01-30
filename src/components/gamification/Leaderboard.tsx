"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Ribbon, Crown, Star, TrendingUp, Users } from "lucide-react";

interface LeaderboardEntry {
    user_id: string;
    total_points: number;
    total_bookings: number;
    total_spent: number;
    achievement_count: number;
    rank: number;
    tier: string;
    user?: {
        full_name: string;
        avatar_url: string;
    };
}

export function Leaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch("/api/referrals/leaderboard");
            const data = await response.json();
            setEntries(data.leaderboard || []);
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const getTierBadge = (tier: string) => {
        const badges: Record<string, { icon: any; color: string; label: string }> = {
            bronze: { icon: Medal, color: "text-orange-400", label: "Bronze" },
            silver: { icon: Medal, color: "text-slate-400", label: "Silver" },
            gold: { icon: Trophy, color: "text-yellow-400", label: "Gold" },
            platinum: { icon: Ribbon, color: "text-purple-400", label: "Platinum" },
            diamond: { icon: Crown, color: "text-blue-400", label: "Diamond" },
        };
        const config = badges[tier.toLowerCase()] || badges.bronze;
        const Icon = config.icon;
        return (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 ${config.color} text-[10px] font-bold uppercase tracking-wider`}>
                <Icon size={12} />
                {config.label}
            </div>
        );
    };

    const getRankStyles = (rank: number) => {
        if (rank === 1) return "from-yellow-400/20 to-yellow-600/20 border-yellow-400/50 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.2)]";
        if (rank === 2) return "from-slate-400/20 to-slate-600/20 border-slate-400/50 text-slate-400";
        if (rank === 3) return "from-orange-400/20 to-orange-600/20 border-orange-400/50 text-orange-400";
        return "bg-white/5 border-white/10 text-[#888]";
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown size={24} className="text-yellow-400 mb-1" />;
        if (rank === 2) return <Medal size={22} className="text-slate-400 mb-1" />;
        if (rank === 3) return <Medal size={20} className="text-orange-400 mb-1" />;
        return <span className="text-sm font-bold">#{rank}</span>;
    };

    if (loading) {
        return (
            <div className="glass-card rounded-2xl p-12 text-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-4 border-[#ff1744]/20 border-t-[#ff1744] rounded-full mx-auto mb-4"
                />
                <p className="text-[#888] font-medium">Crunching the numbers...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Trophy className="text-[#d4af37]" />
                        Top Detailing Enthusiasts
                    </h2>
                    <p className="text-[#888] text-sm mt-1">Celebrating our most active community members</p>
                </div>
            </div>

            <div className="grid gap-4">
                {entries.length > 0 ? (
                    entries.slice(0, 10).map((entry, index) => (
                        <motion.div
                            key={entry.user_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`glass-card p-4 flex items-center gap-6 group hover:bg-white/5 transition-all relative overflow-hidden`}
                        >
                            {/* Rank Badge */}
                            <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center bg-gradient-to-br ${getRankStyles(entry.rank)}`}>
                                {getRankIcon(entry.rank)}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff1744]/20 to-[#d4af37]/20 border border-white/10 flex items-center justify-center text-xl font-bold text-white">
                                    {entry.user?.full_name?.[0] || entry.user_id[0].toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-white group-hover:text-[#ff1744] transition-colors uppercase tracking-tight">
                                            {entry.user?.full_name || `Member #${entry.user_id.slice(0, 4)}`}
                                        </h3>
                                        {getTierBadge(entry.tier)}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-[#888]">
                                        <span className="flex items-center gap-1">
                                            <TrendingUp size={12} className="text-green-500" />
                                            {entry.total_bookings} Services
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users size={12} className="text-blue-500" />
                                            Rank {entry.rank}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Points Detail */}
                            <div className="text-right">
                                <div className="text-lg font-black text-white group-hover:scale-110 transition-transform origin-right flex items-center gap-1.5 justify-end">
                                    {entry.total_points.toLocaleString()}
                                    <Star size={16} className="text-[#d4af37]" fill="#d4af37" />
                                </div>
                                <div className="text-[10px] text-[#666] font-bold uppercase tracking-widest mt-0.5">
                                    Total Points
                                </div>
                            </div>

                            {/* Shine Effect for Top 3 */}
                            {entry.rank <= 3 && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                            )}
                        </motion.div>
                    ))
                ) : (
                    <div className="glass-card p-12 text-center rounded-2xl border-dashed border-white/10 bg-white/[0.02]">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-white/20">
                            <Trophy size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Be the First on the Board!</h3>
                        <p className="text-[#888] max-w-xs mx-auto">Complete services and refer friends to earn points and secure your spot on our exclusive leaderboard.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
