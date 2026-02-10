"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy, TrendingUp, Heart, MessageCircle, Share2, Eye,
    Upload, Award, Users, Sparkles, Filter, Search, Play,
    Camera, Medal, Crown, Star, Calendar, Clock, CheckCircle2
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";
import type {
    ShowroomPost,
    ShowroomContest,
    ReferralLeaderboard
} from "@/lib/types";

export default function ShowroomPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<"feed" | "contests" | "leaderboard">("feed");
    const [posts, setPosts] = useState<ShowroomPost[]>([]);
    const [contests, setContests] = useState<ShowroomContest[]>([]);
    const [leaderboard, setLeaderboard] = useState<ReferralLeaderboard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<"all" | "photo" | "video" | "reel">("all");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === "feed") {
                const res = await fetch("/api/showroom/posts?status=approved&limit=50");
                const data = await res.json();
                setPosts(data || []);
            } else if (activeTab === "contests") {
                const res = await fetch("/api/showroom/contests?status=active,voting");
                const data = await res.json();
                setContests(data || []);
            } else if (activeTab === "leaderboard") {
                const res = await fetch("/api/showroom/leaderboard?limit=50");
                const data = await res.json();
                setLeaderboard(data || []);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async (postId: string) => {
        if (!user) {
            toast.error("Please login to like posts");
            return;
        }

        try {
            const res = await fetch(`/api/showroom/posts/${postId}/like`, {
                method: "POST",
            });
            const data = await res.json();

            if (res.ok) {
                setPosts(posts.map(p =>
                    p.id === postId
                        ? {
                            ...p,
                            is_liked: data.liked,
                            likes_count: p.likes_count + (data.liked ? 1 : -1)
                        }
                        : p
                ));
            }
        } catch (error) {
            toast.error("Failed to like post");
        }
    };

    const filteredPosts = posts.filter(post => {
        const matchesType = filterType === "all" || post.media_type === filterType;
        const matchesSearch = !searchQuery ||
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.car_model?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const getRankBadge = (rank: number | null) => {
        if (!rank) return null;
        if (rank === 1) return <Crown size={20} className="text-[#d4af37]" />;
        if (rank === 2) return <Medal size={20} className="text-gray-400" />;
        if (rank === 3) return <Medal size={20} className="text-amber-700" />;
        return null;
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a]">
            <Navbar />

            <div className="pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Hero Header */}
                    <div className="mb-12 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#ff1744]/20 to-[#d4af37]/20 border border-[#ff1744]/30 mb-6"
                        >
                            <Sparkles size={16} className="text-[#d4af37]" />
                            <span className="text-sm font-medium">Community Showroom</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-6xl font-bold font-display mb-4"
                        >
                            Showcase Your Ride
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-[#888] max-w-2xl mx-auto mb-8"
                        >
                            Share your detailing transformations, compete in contests, and connect with fellow car enthusiasts
                        </motion.p>

                        {user && (
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                onClick={() => router.push("/dashboard/showroom/upload")}
                                className="btn-premium px-8 py-4 rounded-xl text-lg font-semibold flex items-center gap-3 mx-auto"
                            >
                                <Upload size={20} />
                                Post Your Transformation
                            </motion.button>
                        )}
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                        {[
                            { id: "feed", label: "Community Feed", icon: Camera },
                            { id: "contests", label: "Contests", icon: Trophy },
                            { id: "leaderboard", label: "Top Referrers", icon: TrendingUp },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                                        ? "bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white"
                                        : "bg-white/5 hover:bg-white/10 text-[#888]"
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        {/* Community Feed Tab */}
                        {active Tab === "feed" && (
                        <motion.div
                            key="feed"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {/* Filters */}
                            <div className="flex flex-wrap gap-4 mb-8">
                                <div className="flex-1 min-w-[200px]">
                                    <div className="relative">
                                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888]" />
                                        <input
                                            type="text"
                                            placeholder="Search posts..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744]/50 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {["all", "photo", "video", "reel"].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setFilterType(type as any)}
                                            className={`px-4 py-3 rounded-xl font-medium capitalize transition-all ${filterType === type
                                                    ? "bg-[#ff1744] text-white"
                                                    : "bg-white/5 hover:bg-white/10 text-[#888]"
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Posts Grid */}
                            {isLoading ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                                            <div className="aspect-square bg-white/5 rounded-xl mb-4" />
                                            <div className="h-4 bg-white/5 rounded mb-2" />
                                            <div className="h-3 bg-white/5 rounded w-2/3" />
                                        </div>
                                    ))}
                                </div>
                            ) : filteredPosts.length === 0 ? (
                                <div className="glass-card rounded-2xl p-12 text-center">
                                    <Camera size={48} className="mx-auto text-[#888] mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No Posts Yet</h3>
                                    <p className="text-[#888] mb-6">Be the first to share your detailing transformation!</p>
                                    {user && (
                                        <button
                                            onClick={() => router.push("/dashboard/showroom/upload")}
                                            className="btn-premium px-6 py-3 rounded-xl"
                                        >
                                            Upload Now
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredPosts.map((post) => (
                                        <motion.div
                                            key={post.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="glass-card rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer group"
                                            onClick={() => router.push(`/showroom/${post.id}`)}
                                        >
                                            {/* Media */}
                                            <div className="relative aspect-square bg-white/5">
                                                {post.media_type === "video" || post.media_type === "reel" ? (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                                            <Play size={28} className="text-white ml-1" />
                                                        </div>
                                                    </div>
                                                ) : null}
                                                {post.featured && (
                                                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#d4af37] text-black text-xs font-bold flex items-center gap-1">
                                                        <Star size={12} fill="currentColor" />
                                                        Featured
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                            </div>

                                            {/* Content */}
                                            <div className="p-6">
                                                <h3 className="text-lg font-semibold mb-2 line-clamp-2">{post.title}</h3>
                                                {post.description && (
                                                    <p className="text-sm text-[#888] mb-4 line-clamp-2">{post.description}</p>
                                                )}

                                                {/* User Info */}
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff1744] to-[#d4af37]" />
                                                    <div>
                                                        <p className="text-sm font-medium">{post.user?.full_name || "Anonymous"}</p>
                                                        {post.car_model && (
                                                            <p className="text-xs text-[#666]">{post.car_model}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Engagement Stats */}
                                                <div className="flex items-center justify-between">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleLike(post.id);
                                                        }}
                                                        className="flex items-center gap-2 text-sm hover:text-[#ff1744] transition-colors"
                                                    >
                                                        <Heart
                                                            size={18}
                                                            className={post.is_liked ? "fill-[#ff1744] text-[#ff1744]" : ""}
                                                        />
                                                        {post.likes_count}
                                                    </button>

                                                    <div className="flex items-center gap-2 text-sm text-[#888]">
                                                        <MessageCircle size={18} />
                                                        {post.comments_count}
                                                    </div>

                                                    <div className="flex items-center gap-2 text-sm text-[#888]">
                                                        <Eye size={18} />
                                                        {post.views_count}
                                                    </div>
                                                </div>

                                                {/* Contest Badge */}
                                                {post.contest_entry && (
                                                    <div className="mt-4 px-3 py-2 rounded-lg bg-[#ff1744]/10 border border-[#ff1744]/30 text-xs font-medium flex items-center gap-2">
                                                        <Trophy size={14} className="text-[#ff1744]" />
                                                        Contest Entry
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
            )}

                        {/* Contests Tab */}
                        {activeTab === "contests" && (
                            <motion.div
                                key="contests"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {isLoading ? (
                                    <div className="space-y-6">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="glass-card rounded-2xl p-8 animate-pulse">
                                                <div className="h-6 bg-white/5 rounded w-1/3 mb-4" />
                                                <div className="h-4 bg-white/5 rounded w-2/3 mb-2" />
                                                <div className="h-4 bg-white/5 rounded w-1/2" />
                                            </div>
                                        ))}
                                    </div>
                                ) : contests.length === 0 ? (
                                    <div className="glass-card rounded-2xl p-12 text-center">
                                        <Trophy size={48} className="mx-auto text-[#888] mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No Active Contests</h3>
                                        <p className="text-[#888]">Check back soon for exciting competitions!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {contests.map((contest) => {
                                            const daysLeft = Math.ceil(
                                                (new Date(contest.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                                            );

                                            return (
                                                <div key={contest.id} className="glass-card rounded-2xl p-8 border border-[#ff1744]/30">
                                                    <div className="flex items-start justify-between mb-6">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <Trophy size={24} className="text-[#d4af37]" />
                                                                <h2 className="text-2xl font-bold">{contest.title}</h2>
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${contest.status === 'active' ? 'bg-green-500/20 text-green-500' :
                                                                        contest.status === 'voting' ? 'bg-yellow-500/20 text-yellow-500' :
                                                                            'bg-white/10 text-white'
                                                                    }`}>
                                                                    {contest.status.toUpperCase()}
                                                                </span>
                                                            </div>
                                                            {contest.description && (
                                                                <p className="text-[#888] mb-4">{contest.description}</p>
                                                            )}
                                                            {contest.theme && (
                                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-sm">
                                                                    <Sparkles size={14} />
                                                                    Theme: {contest.theme}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {contest.banner_image_url && (
                                                            <div className="w-32 h-32 rounded-xl bg-white/5 ml-6" />
                                                        )}
                                                    </div>

                                                    {/* Contest Stats */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-[#ff1744]">{contest.total_entries}</div>
                                                            <div className="text-xs text-[#888]">Entries</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-[#d4af37]">{contest.total_votes}</div>
                                                            <div className="text-xs text-[#888]">Votes</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-green-500">{daysLeft}</div>
                                                            <div className="text-xs text-[#888]">Days Left</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-white">{contest.winner_points}</div>
                                                            <div className="text-xs text-[#888]">Winner Points</div>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex gap-4">
                                                        <button
                                                            onClick={() => router.push(`/showroom/contests/${contest.id}`)}
                                                            className="flex-1 btn-premium py-3 rounded-xl font-semibold"
                                                        >
                                                            View Details
                                                        </button>
                                                        {user && contest.status === 'active' && (
                                                            <button
                                                                onClick={() => router.push(`/dashboard/showroom/upload?contest=${contest.id}`)}
                                                                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl font-semibold transition-colors"
                                                            >
                                                                Enter Contest
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Leaderboard Tab */}
                        {activeTab === "leaderboard" && (
                            <motion.div
                                key="leaderboard"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {isLoading ? (
                                    <div className="space-y-4">
                                        {[...Array(10)].map((_, i) => (
                                            <div key={i} className="glass-card rounded-xl p-6 animate-pulse">
                                                <div className="h-4 bg-white/5 rounded" />
                                            </div>
                                        ))}
                                    </div>
                                ) : leaderboard.length === 0 ? (
                                    <div className="glass-card rounded-2xl p-12 text-center">
                                        <Users size={48} className="mx-auto text-[#888] mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No Rankings Yet</h3>
                                        <p className="text-[#888]">Start referring friends to climb the leaderboard!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {leaderboard.map((entry, index) => (
                                            <div
                                                key={entry.id}
                                                className={`glass-card rounded-xl p-6 ${index < 3 ? 'border-2' : ''
                                                    } ${index === 0 ? 'border-[#d4af37]' :
                                                        index === 1 ? 'border-gray-400' :
                                                            index === 2 ? 'border-amber-700' :
                                                                'border-transparent'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4 flex-1">
                                                        {/* Rank */}
                                                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 font-bold">
                                                            {getRankBadge(entry.current_rank) || `#${entry.current_rank}`}
                                                        </div>

                                                        {/* User */}
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff1744] to-[#d4af37]" />
                                                            <div>
                                                                <p className="font-semibold">{entry.user?.full_name || "Anonymous"}</p>
                                                                {entry.achievement_badges && entry.achievement_badges.length > 0 && (
                                                                    <div className="flex gap-1 mt-1">
                                                                        {entry.achievement_badges.slice(0, 3).map((badge, i) => (
                                                                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#ff1744]/20 text-[#ff1744]">
                                                                                {badge}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Stats */}
                                                        <div className="hidden md:flex gap-8">
                                                            <div className="text-center">
                                                                <div className="text-xl font-bold">{entry.total_referrals}</div>
                                                                <div className="text-xs text-[#888]">Referrals</div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-xl font-bold text-green-500">
                                                                    ₹{(entry.total_revenue_generated || 0).toLocaleString()}
                                                                </div>
                                                                <div className="text-xs text-[#888]">Revenue</div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-xl font-bold text-[#d4af37]">
                                                                    ₹{(entry.total_rewards_earned || 0).toLocaleString()}
                                                                </div>
                                                                <div className="text-xs text-[#888]">Earned</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <Footer />
        </main>
    );
}
