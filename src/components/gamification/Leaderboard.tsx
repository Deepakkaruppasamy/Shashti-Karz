"use client";

import { useEffect, useState } from "react";

interface LeaderboardEntry {
    user_id: string;
    total_points: number;
    total_bookings: number;
    total_spent: number;
    achievement_count: number;
    rank: number;
    tier: string;
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
        const badges: Record<string, string> = {
            bronze: "🥉",
            silver: "🥈",
            gold: "🥇",
            platinum: "💎",
            diamond: "👑",
        };
        return badges[tier] || "🏅";
    };

    const getRankMedal = (rank: number) => {
        if (rank === 1) return "🥇";
        if (rank === 2) return "🥈";
        if (rank === 3) return "🥉";
        return `#${rank}`;
    };

    if (loading) {
        return <div className="text-center py-8">Loading leaderboard...</div>;
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <span>🏆</span>
                    <span>Top Customers</span>
                </h2>
                <p className="text-yellow-100 mt-1">Compete for the top spot!</p>
            </div>

            <div className="divide-y divide-gray-200">
                {entries.slice(0, 10).map((entry, index) => (
                    <div
                        key={entry.user_id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${index < 3 ? "bg-yellow-50" : ""
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 text-center">
                                <div className="text-2xl font-bold">{getRankMedal(entry.rank)}</div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">Customer #{entry.user_id.slice(0, 8)}</span>
                                    <span className="text-xl">{getTierBadge(entry.tier)}</span>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                    <span>💰 ₹{entry.total_spent.toLocaleString()}</span>
                                    <span>📦 {entry.total_bookings} bookings</span>
                                    <span>🏆 {entry.achievement_count} achievements</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600">{entry.total_points}</div>
                                <div className="text-xs text-gray-500">points</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {entries.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-2">🏆</div>
                    <p>No leaderboard data yet</p>
                </div>
            )}
        </div>
    );
}
