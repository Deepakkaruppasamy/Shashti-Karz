"use client";

import { useState, useEffect } from "react";
import {
    Activity, MessageSquare, Headphones, Star, AlertCircle,
    Clock, TrendingUp, Search, RefreshCw, Layers, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandedLoader } from "@/components/animations/BrandedLoader";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { toast } from "sonner";

interface LayoutEvent {
    id: string;
    type: 'booking' | 'support' | 'review' | 'reschedule';
    title: string;
    description: string;
    timestamp: string;
    meta?: any;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export default function AdminPulsePage() {
    const [events, setEvents] = useState<LayoutEvent[]>([]);
    const [stats, setStats] = useState({
        bookings: 0,
        support: 0,
        reviews: 0,
        reschedules: 0,
        urgent: 0
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");

    const supabase = createClient();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const isoYesterday = yesterday.toISOString();

            const [bookings, support, reviews, reschedules] = await Promise.all([
                supabase.from('bookings').select('id, created_at, car_model').gte('created_at', isoYesterday).order('created_at', { ascending: false }).limit(20),
                supabase.from('support_requests').select('id, created_at, subject, status, priority').gte('created_at', isoYesterday).order('created_at', { ascending: false }).limit(20),
                supabase.from('reviews').select('id, created_at, rating, comment, sentiment_label').gte('created_at', isoYesterday).order('created_at', { ascending: false }).limit(20),
                supabase.from('reschedule_requests').select('id, created_at, status').gte('created_at', isoYesterday).order('created_at', { ascending: false }).limit(20)
            ]);

            const newEvents: LayoutEvent[] = [];

            bookings.data?.forEach(b => newEvents.push({
                id: b.id,
                type: 'booking',
                title: 'New Booking',
                description: `Vehicle: ${b.car_model}`,
                timestamp: b.created_at,
                priority: 'medium'
            }));

            support.data?.forEach(s => newEvents.push({
                id: s.id,
                type: 'support',
                title: 'Support Ticket',
                description: s.subject,
                timestamp: s.created_at,
                priority: s.priority as any
            }));

            reviews.data?.forEach(r => newEvents.push({
                id: r.id,
                type: 'review',
                title: `${r.rating} Star Review`,
                description: r.comment,
                timestamp: r.created_at,
                meta: { sentiment: r.sentiment_label },
                priority: r.rating < 3 ? 'high' : 'low'
            }));

            reschedules.data?.forEach(r => newEvents.push({
                id: r.id,
                type: 'reschedule',
                title: 'Reschedule Request',
                description: `Status: ${r.status}`,
                timestamp: r.created_at,
                priority: 'medium'
            }));

            // Sort by newest
            newEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            setEvents(newEvents);
            setStats({
                bookings: bookings.data?.length || 0,
                support: support.data?.length || 0,
                reviews: reviews.data?.length || 0,
                reschedules: reschedules.data?.length || 0,
                urgent: support.data?.filter(s => s.priority === 'urgent').length || 0
            });

        } catch (error) {
            console.error("Pulse data error", error);
        } finally {
            setLoading(false);
        }
    };

    // Realtime Subscriptions
    useRealtimeSubscription({
        table: 'bookings',
        onInsert: (payload) => {
            addEvent({
                id: payload.id,
                type: 'booking',
                title: 'New Booking',
                description: `Vehicle: ${payload.car_model || 'Unknown'}`,
                timestamp: payload.created_at,
                priority: 'medium'
            });
            setStats(s => ({ ...s, bookings: s.bookings + 1 }));
            toast.success("New Booking Received!");
        }
    });

    useRealtimeSubscription({
        table: 'support_requests',
        onInsert: (payload) => {
            addEvent({
                id: payload.id,
                type: 'support',
                title: 'Support Ticket',
                description: payload.subject,
                timestamp: payload.created_at || new Date().toISOString(),
                priority: payload.priority
            });
            setStats(s => ({ ...s, support: s.support + 1, urgent: payload.priority === 'urgent' ? s.urgent + 1 : s.urgent }));
            toast.info("New Support Ticket");
        }
    });

    useRealtimeSubscription({
        table: 'reviews',
        onInsert: (payload) => {
            addEvent({
                id: payload.id,
                type: 'review',
                title: `${payload.rating} Star Review`,
                description: payload.comment,
                timestamp: payload.created_at || new Date().toISOString(),
                priority: payload.rating < 3 ? 'high' : 'low'
            });
            setStats(s => ({ ...s, reviews: s.reviews + 1 }));
            if (payload.rating > 4) toast("Positive Review Received!", { icon: '⭐' });
        }
    });

    useRealtimeSubscription({
        table: 'reschedule_requests',
        onInsert: (payload) => {
            addEvent({
                id: payload.id,
                type: 'reschedule',
                title: 'Reschedule Request',
                description: 'User requested a slot change',
                timestamp: payload.created_at || new Date().toISOString(),
                priority: 'medium'
            });
            setStats(s => ({ ...s, reschedules: s.reschedules + 1 }));
            toast("Reschedule Request");
        }
    });

    const addEvent = (event: LayoutEvent) => {
        setEvents(prev => [event, ...prev].slice(0, 50)); // Keep last 50
    };

    const filteredEvents = events.filter(event => {
        if (filter !== "all" && event.type !== filter) return false;
        if (search && !JSON.stringify(event).toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const getEventIcon = (type: string) => {
        switch (type) {
            case "booking": return <Calendar className="text-green-400" size={18} />;
            case "support": return <Headphones className="text-purple-400" size={18} />;
            case "review": return <Star className="text-yellow-400" size={18} />;
            case "reschedule": return <Clock className="text-blue-400" size={18} />;
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

    if (loading) return <BrandedLoader fullPage />;

    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white">

            <div className="flex-1 p-4 lg:p-8 overflow-auto pb-24 lg:pb-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400 mb-2">
                            ADMIN PULSE
                        </h1>
                        <p className="text-slate-400 flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Live System Activity
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchInitialData}
                            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-400 hover:text-white"
                        >
                            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-10">
                    {[
                        { label: "Bookings (24h)", value: stats.bookings, icon: Calendar, color: "text-green-400" },
                        { label: "Support Tickets", value: stats.support, icon: Headphones, color: "text-purple-400" },
                        { label: "Urgent Issues", value: stats.urgent, icon: AlertCircle, color: "text-red-400" },
                        { label: "New Reviews", value: stats.reviews, icon: Star, color: "text-yellow-400" },
                        { label: "Reschedules", value: stats.reschedules, icon: Clock, color: "text-blue-400" }
                    ].map((stat, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={idx}
                            className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6 backdrop-blur-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 lg:p-3 rounded-xl bg-white/5 ${stat.color}`}>
                                    <stat.icon size={20} className="lg:w-6 lg:h-6" />
                                </div>
                            </div>
                            <h3 className="text-xl lg:text-3xl font-bold mb-1">{stat.value}</h3>
                            <p className="text-slate-500 text-[10px] lg:text-xs uppercase font-black tracking-widest truncate">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between bg-white/5 border border-white/10 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
                            {["all", "booking", "support", "review", "reschedule"].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setFilter(t)}
                                    className={`flex-1 min-w-fit py-2 px-3 lg:px-4 rounded-xl text-[10px] lg:text-sm font-medium capitalize transition-all whitespace-nowrap ${filter === t ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "text-slate-400 hover:text-white"
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {filteredEvents.map((event) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        key={event.id}
                                        className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-5 hover:bg-white/[0.08] transition-all group"
                                    >
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center p-2">
                                                    {getEventIcon(event.type)}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-bold text-slate-200 text-sm">{event.title}</span>
                                                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                                                    </span>
                                                </div>

                                                <div>
                                                    <p className="text-slate-400 text-xs lg:text-sm mb-3">"{event.description}"</p>
                                                    {event.priority && (
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-black tracking-wider ${getPriorityColor(event.priority)}`}>
                                                                {event.priority} Priority
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Sidebar / Analytics */}
                    <div className="space-y-8">
                        {/* Live Feed Status */}
                        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                            <div className="flex items-center justify-between mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                <span>System Status</span>
                                <span className="text-green-500 animate-pulse">Live</span>
                            </div>
                            <div className="space-y-3">
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        animate={{ width: ["30%", "60%", "45%"] }}
                                        transition={{ duration: 5, repeat: Infinity }}
                                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                                    ></motion.div>
                                </div>
                                <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest">Monitoring {events.length} Events</p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/20 rounded-3xl p-6 lg:p-8 relative overflow-hidden group">
                            <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <Layers size={160} />
                            </div>
                            <h3 className="text-xl font-bold mb-4 relative z-10">Command Center</h3>
                            <ul className="space-y-4 relative z-10">
                                <li className="flex items-center gap-3 text-slate-300 text-[10px] lg:text-sm">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                                    System is running optimally.
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 text-[10px] lg:text-sm">
                                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full flex-shrink-0"></div>
                                    Database Latency: 45ms.
                                </li>
                            </ul>
                            <button onClick={fetchInitialData} className="w-full mt-8 py-3 rounded-2xl bg-white text-black font-bold text-sm hover:bg-slate-200 transition-all relative z-10">
                                REFRESH DATA STREAM
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
