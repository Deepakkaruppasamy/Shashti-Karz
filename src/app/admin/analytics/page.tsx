"use client";

import { useState, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import {
    TrendingUp, Users, DollarSign, Package, Building2,
    Target, Zap, Activity, ShieldCheck, ArrowUpRight,
    Filter, Download, Calendar, RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const COLORS = ['#ff1744', '#d4af37', '#2196F3', '#4CAF50', '#9C27B0'];

export default function GlobalAnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeRange, setActiveRange] = useState("6M");

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/global-analytics");
            const json = await res.json();
            setData(json);
        } catch (error) {
            toast.error("Failed to sync with global intelligence");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-[#ff1744] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[#888] font-black uppercase tracking-[0.3em] text-xs">Syncing Global Intelligence...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 space-y-8 pb-24 lg:pb-8">
            {/* Header HUD */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#888]">Enterprise Intelligence Portal</span>
                    </div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Global <span className="text-gradient">Optics</span> Dashboard</h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                        {["1M", "3M", "6M", "1Y"].map(range => (
                            <button
                                key={range}
                                onClick={() => setActiveRange(range)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${activeRange === range ? "bg-white/10 text-white" : "text-[#444] hover:text-[#888]"
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    <button onClick={fetchAnalytics} className="p-3 rounded-xl bg-white/5 border border-white/5 text-[#888] hover:text-white hover:border-white/10 transition-all">
                        <RefreshCw size={18} />
                    </button>
                    <button className="btn-premium px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Download size={16} /> Export Intelligence
                    </button>
                </div>
            </div>

            {/* Metric HQ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Asset Value", value: `₹${data.stats.totalRevenue.toLocaleString()}`, change: "+14.2%", icon: DollarSign, color: "text-green-500" },
                    { label: "Fleet Penetration", value: data.stats.totalFleets, change: "+3 New", icon: Building2, color: "text-blue-500" },
                    { label: "Operational Mission", value: data.stats.totalBookings, change: "+12% MoM", icon: Target, color: "text-[#ff1744]" },
                    { label: "Public Sentiment", value: `${data.stats.avgRating}/5`, change: "Excellent", icon: ShieldCheck, color: "text-[#d4af37]" },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="glass-card rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl rounded-full ${stat.color === 'text-green-500' ? 'bg-green-500' : stat.color === 'text-blue-500' ? 'bg-blue-500' : 'bg-[#ff1744]'}`} />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                            <span className={`text-[10px] font-black ${stat.change.startsWith('+') ? 'text-green-500' : 'text-[#888]'} flex items-center gap-1`}>
                                {stat.change} <ArrowUpRight size={10} />
                            </span>
                        </div>
                        <h3 className="text-3xl font-black italic tracking-tighter relative z-10">{stat.value}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#444] mt-1 relative z-10">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Revenue Trajectory */}
                <div className="lg:col-span-2 glass-card rounded-[3rem] p-8 border border-white/5">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.3em]">Revenue Trajectory</h3>
                            <p className="text-[10px] text-[#444] font-bold uppercase mt-1">Institutional vs Private Growth</p>
                        </div>
                    </div>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.revenueTrends}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff1744" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ff1744" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#444', fontSize: 10, fontWeight: 'bold' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#444', fontSize: 10, fontWeight: 'bold' }}
                                    tickFormatter={(val) => `₹${val / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{ background: '#0d0d0d', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '10px' }}
                                    itemStyle={{ color: '#ff1744', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#ff1744"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Fleet Revenue Strategy */}
                <div className="glass-card rounded-[3rem] p-8 border border-white/5 flex flex-col items-center justify-center text-center">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-12">Revenue Allocation Mix</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.fleetMix}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {data.fleetMix.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#0d0d0d', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '10px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-8 w-full mt-12">
                        {data.fleetMix.map((item: any, i: number) => (
                            <div key={i}>
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#888]">{item.name}</span>
                                </div>
                                <p className="text-xl font-black italic tracking-tighter leading-none">
                                    {Math.round((item.value / data.stats.totalRevenue) * 100)}%
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Service Performance Audit */}
                <div className="glass-card rounded-[3rem] p-8 border border-white/5">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8">Service Performance Audit</h3>
                    <div className="space-y-6">
                        {data.servicePerformance.slice(0, 5).map((service: any, i: number) => {
                            const maxRevenue = data.servicePerformance[0].revenue;
                            const width = (service.revenue / maxRevenue) * 100;
                            return (
                                <div key={i} className="group">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold uppercase text-white group-hover:text-[#ff1744] transition-colors">{service.name}</span>
                                        <span className="text-[10px] font-black text-[#d4af37]">₹{service.revenue.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${width}%` }}
                                            transition={{ delay: i * 0.1, duration: 1 }}
                                            className="h-full bg-gradient-to-r from-[#ff1744] to-[#d4af37]"
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-[8px] font-black text-[#444] uppercase tracking-widest">{service.count} Successful Missions</span>
                                        <span className="text-[8px] font-black text-[#444] uppercase tracking-widest">Efficiency: 98.2%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Operational Efficiency HUD */}
                <div className="glass-card rounded-[3rem] p-8 border border-[#ff1744]/20 bg-[#ff1744]/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8">
                        <Activity className="text-[#ff1744] animate-pulse" size={32} />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-12">System Efficiency Matrix</h3>

                    <div className="grid grid-cols-1 gap-8 relative z-10">
                        {[
                            { label: "Average Tactical Service Duration", value: data.efficiency.avgServiceTime, sub: "0.4h Improvement" },
                            { label: "Strategic On-Time Completion Rate", value: data.efficiency.onTimeRate, sub: "Record Performance" },
                            { label: "Personnel Resource Utilization", value: data.efficiency.resourceUtilization, sub: "Optimized Load" },
                        ].map((eff, i) => (
                            <div key={i} className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                    <Zap className="text-[#d4af37]" size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#ff1744] mb-1">{eff.label}</p>
                                    <p className="text-3xl font-black italic tracking-tighter leading-none mb-1">{eff.value}</p>
                                    <p className="text-[10px] font-bold text-[#888] uppercase">{eff.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full mt-12 py-5 rounded-[2rem] bg-[#ff1744] text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all">
                        Initiate Performance Optimization
                    </button>
                </div>
            </div>
        </div>
    );
}
