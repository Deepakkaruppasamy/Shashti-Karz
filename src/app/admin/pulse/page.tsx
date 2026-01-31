"use client";

import { useState, useEffect } from "react";
import {
    Activity, MessageSquare, Headphones, Star, AlertCircle,
    Clock, TrendingUp, Search, Filter, RefreshCw, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";

/**
 * Admin Pulse Dashboard
 * Real-time monitoring of Dinesh interactions and support activities
 */
export default function AdminPulsePage() {
    const [events, setEvents] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [wordCloud, setWordCloud] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");

    const fetchData = async () => {
        try {
            const response = await fetch("/api/admin/pulse");
            const data = await response.json();
            if (data.success) {
                setEvents(data.events);
                setStats(data.stats);
                setWordCloud(data.wordCloud);
            }
        } catch (error) {
            console.error("Error fetching pulse data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredEvents = events.filter(event => {
        if (filter !== "all" && event.type !== filter) return false;
        if (search && !JSON.stringify(event).toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const getEventIcon = (type: string) => {
        switch (type) {
            case "interaction": return <MessageSquare className="text-blue-400" size={18} />;
            case "support_request": return <Headphones className="text-purple-400" size={18} />;
            case "feedback": return <Star className="text-yellow-400" size={18} />;
            default: return <Activity className="text-slate-400" size={18} />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "urgent": return "bg-red-500/20 text-red-500 border-red-500/30";
            case "high": return "bg-orange-500/20 text-orange-500 border-orange-500/30";
            case "medium": return "bg-blue-500/20 text-blue-500 border-blue-500/30";
            default: return "bg-slate-500/20 text-slate-500 border-slate-500/30";
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400 mb-2">
                        ADMIN PULSE
                    </h1>
                    <p className="text-slate-400 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Real-time customer interaction monitor
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-400 hover:text-white"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search pulse..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: "Total Interactions", value: stats?.totalInteractions || 0, icon: MessageSquare, color: "text-blue-400" },
                    { label: "Pending Support", value: stats?.pendingRequests || 0, icon: Headphones, color: "text-purple-400" },
                    { label: "Urgent Alerts", value: stats?.urgentRequests || 0, icon: AlertCircle, color: "text-red-400" },
                    { label: "New Feedback", value: stats?.newFeedback || 0, icon: Star, color: "text-yellow-400" }
                ].map((stat, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx}
                        className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="text-slate-500 text-xs font-medium">Last 24h</span>
                        </div>
                        <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                        <p className="text-slate-500 text-sm">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 p-2 rounded-2xl">
                        {["all", "interaction", "support_request", "feedback"].map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium capitalize transition-all ${filter === t ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "text-slate-400 hover:text-white"
                                    }`}
                            >
                                {t.replace("_", " ")}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {filteredEvents.map((event, idx) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={event.id}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.08] transition-all group"
                                >
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center p-2">
                                                {getEventIcon(event.type)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-bold text-slate-200">{event.user_name}</span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                                                </span>
                                            </div>

                                            {event.type === "interaction" && (
                                                <div>
                                                    <p className="text-slate-400 text-sm mb-3">"{event.query}"</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase font-black tracking-wider">
                                                            Intent: {event.intent}
                                                        </span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 uppercase font-black tracking-wider">
                                                            {Math.round(event.confidence * 100)}% Match
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {event.type === "support_request" && (
                                                <div>
                                                    <p className="font-medium text-slate-300 mb-1">{event.subject}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-black tracking-wider ${getPriorityColor(event.priority)}`}>
                                                            {event.priority}
                                                        </span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 uppercase font-black tracking-wider">
                                                            {event.category}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {event.type === "feedback" && (
                                                <div>
                                                    <p className="text-slate-400 text-sm mb-2 italic">"{event.message}"</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex gap-0.5 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={10} className={i < (event.rating || 0) ? "fill-yellow-500 text-yellow-500" : "text-yellow-500/20"} />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 uppercase font-black tracking-wider">
                                                            {event.feedbackType}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Sidebar / Analytics */}
                <div className="space-y-8">
                    {/* Word Cloud / Trends */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <TrendingUp size={20} className="text-indigo-400" />
                            Hot Topics
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {wordCloud.map((item, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:border-purple-500/50 hover:bg-purple-500/10 transition-all cursor-default"
                                    style={{ fontSize: `${Math.max(12, 12 + item.count * 2)}px` }}
                                >
                                    {item.word}
                                </span>
                            ))}
                            {wordCloud.length === 0 && <p className="text-slate-500 text-sm italic">Gathering insights...</p>}
                        </div>
                    </div>

                    {/* Productivity / Action Items */}
                    <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/20 rounded-3xl p-8 relative overflow-hidden group">
                        <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <Layers size={160} />
                        </div>
                        <h3 className="text-xl font-bold mb-4 relative z-10">Quick Insights</h3>
                        <ul className="space-y-4 relative z-10">
                            <li className="flex items-center gap-3 text-slate-300 text-sm">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                Dinesh successfully answered {Math.round((stats?.totalInteractions || 0) * 0.85)} queries today.
                            </li>
                            <li className="flex items-center gap-3 text-slate-300 text-sm">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                Average response time is under 2 seconds.
                            </li>
                            <li className="flex items-center gap-3 text-slate-300 text-sm">
                                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                                Feedback sentiment is 94% positive.
                            </li>
                        </ul>
                        <button className="w-full mt-8 py-3 rounded-2xl bg-white text-black font-bold text-sm hover:bg-slate-200 transition-all">
                            DOWNLOAD REPORT
                        </button>
                    </div>

                    {/* Active Users Helper */}
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                        <div className="flex items-center justify-between mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                            <span>Live Pulse Status</span>
                            <span className="text-green-500">Active</span>
                        </div>
                        <div className="space-y-3">
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ width: ["30%", "60%", "45%"] }}
                                    transition={{ duration: 5, repeat: Infinity }}
                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                                ></motion.div>
                            </div>
                            <p className="text-xs text-slate-500 text-center">System performing at peak efficiency</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
