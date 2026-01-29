"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Trophy, Award, Target, Crown, TrendingUp, Star, Gift } from "lucide-react";
import { AchievementsDisplay } from "@/components/gamification/AchievementsDisplay";
import { Leaderboard } from "@/components/gamification/Leaderboard";

interface UserPoints {
    total_points: number;
    tier: string;
    achievements_count: number;
    rank: number;
}

export default function RewardsPage() {
    const { user, profile } = useAuth();
    const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
    const [activeTab, setActiveTab] = useState<"achievements" | "leaderboard">("achievements");

    useEffect(() => {
        if (user) {
            fetchUserPoints();
        }
    }, [user]);

    const fetchUserPoints = async () => {
        try {
            const response = await fetch("/api/achievements");
            const data = await response.json();
            setUserPoints(data.summary);
        } catch (error) {
            console.error("Error fetching points:", error);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pt-24 pb-12 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <Trophy className="mx-auto mb-6 text-purple-600" size={64} />
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Rewards & Achievements</h1>
                    <p className="text-lg text-gray-600 mb-8">
                        Login to view your achievements and compete on the leaderboard!
                    </p>
                    <a
                        href="/login"
                        className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:shadow-lg transition-all"
                    >
                        Login to Continue
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg mb-6">
                        <Trophy className="text-yellow-500" size={32} />
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            Rewards Center
                        </h1>
                    </div>
                    <p className="text-gray-700 text-lg">
                        Welcome back, <strong>{profile?.full_name || "Champion"}</strong>! 🎉
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Star className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Points</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {userPoints?.total_points?.toLocaleString() || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Award className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Achievements</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {userPoints?.achievements_count || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-yellow-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <Crown className="text-yellow-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Tier</p>
                                <p className="text-2xl font-bold text-yellow-600 capitalize">
                                    {userPoints?.tier || "Bronze"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <TrendingUp className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Rank</p>
                                <p className="text-2xl font-bold text-green-600">
                                    #{userPoints?.rank || "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-lg w-fit mx-auto">
                    <button
                        onClick={() => setActiveTab("achievements")}
                        className={`px-8 py-3 rounded-xl font-semibold transition-all ${activeTab === "achievements"
                                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        <Award className="inline mr-2" size={20} />
                        Achievements
                    </button>
                    <button
                        onClick={() => setActiveTab("leaderboard")}
                        className={`px-8 py-3 rounded-xl font-semibold transition-all ${activeTab === "leaderboard"
                                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        <Trophy className="inline mr-2" size={20} />
                        Leaderboard
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white rounded-3xl p-8 shadow-xl">
                    {activeTab === "achievements" ? (
                        <AchievementsDisplay />
                    ) : (
                        <Leaderboard />
                    )}
                </div>

                {/* Rewards Info */}
                <div className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 text-white shadow-xl">
                    <div className="flex items-start gap-4">
                        <Gift size={48} className="flex-shrink-0" />
                        <div>
                            <h2 className="text-2xl font-bold mb-2">How to Earn More Points?</h2>
                            <ul className="space-y-2 text-white/90">
                                <li>✨ Complete bookings - Earn points for each service</li>
                                <li>⭐ Leave reviews - Get bonus points for detailed reviews</li>
                                <li>📸 Share photos - Extra points for before/after pics</li>
                                <li>🎯 Unlock achievements - Bonus multipliers for special milestones</li>
                                <li>🔄 Refer friends - Get points when they book their first service</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
