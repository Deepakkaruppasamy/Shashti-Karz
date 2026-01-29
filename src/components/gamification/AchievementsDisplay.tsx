"use client";

import { useEffect, useState } from "react";

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

            setAchievements(data.all_achievements || []);
            setUnlocked(data.unlocked || []);
            setPoints(data.points);
        } catch (error) {
            console.error("Error fetching achievements:", error);
        } finally {
            setLoading(false);
        }
    };

    const isUnlocked = (achievementId: string) => {
        return unlocked.some((ua) => ua.achievement.id === achievementId);
    };

    const getTierColor = (tier: string) => {
        const colors: Record<string, string> = {
            bronze: "bg-orange-100 text-orange-800 border-orange-300",
            silver: "bg-gray-100 text-gray-800 border-gray-300",
            gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
            platinum: "bg-purple-100 text-purple-800 border-purple-300",
            diamond: "bg-blue-100 text-blue-800 border-blue-300",
        };
        return colors[tier] || "bg-gray-100 text-gray-800 border-gray-300";
    };

    if (loading) {
        return <div className="text-center py-8">Loading achievements...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Points Summary */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{points.total_points} Points</h2>
                        <p className="text-blue-100">Level {points.current_level}</p>
                    </div>
                    <div className="text-5xl">🏆</div>
                </div>
                <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span>Progress to next level</span>
                        <span>{unlocked.length}/{achievements.length} unlocked</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                        <div
                            className="bg-white rounded-full h-2 transition-all"
                            style={{
                                width: `${(unlocked.length / achievements.length) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => {
                    const locked = !isUnlocked(achievement.id);
                    return (
                        <div
                            key={achievement.id}
                            className={`border-2 rounded-lg p-4 transition-all ${locked
                                    ? "bg-gray-50 opacity-60 border-gray-200"
                                    : `${getTierColor(achievement.tier)} border-2`
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`text-4xl ${locked ? "grayscale" : ""}`}>
                                    {achievement.badge_icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{achievement.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {achievement.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-medium px-2 py-1 bg-white rounded-full">
                                            {achievement.points} pts
                                        </span>
                                        <span className="text-xs capitalize">{achievement.tier}</span>
                                    </div>
                                    {!locked && (
                                        <div className="mt-2 text-xs text-green-600 font-medium">
                                            ✅ Unlocked
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
