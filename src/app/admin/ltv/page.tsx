"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Users, AlertTriangle, Crown, DollarSign, Sparkles, Brain, Zap, Target, Activity, BarChart3, PieChart, ArrowUpRight } from "lucide-react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { motion, AnimatePresence } from "framer-motion";

interface Customer {
    user_id: string;
    total_bookings: number;
    total_spent: number;
    average_booking_value: number;
    booking_frequency: number;
    predicted_ltv: number;
    actual_ltv: number;
    customer_segment: string;
    churn_risk_score: number;
    churn_risk_level: string;
    is_vip: boolean;
    loyalty_tier: string;
    user: {
        full_name: string;
        email: string;
    };
}

interface Segment {
    segment_name: string;
    customer_count: number;
    avg_ltv: number;
    total_revenue: number;
    description: string;
}

export default function LTVAdminPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [selectedSegment, setSelectedSegment] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [aiInsight, setAiInsight] = useState<string>("");
    const [isAiLoading, setIsAiLoading] = useState(false);

    const router = useRouter();

    // Real-time subscription
    useRealtimeSubscription<Customer>({
        table: "customer_lifetime_value",
        onUpdate: (updatedItem) => {
            setCustomers(prev => prev.map(c => c.user_id === updatedItem.user_id ? { ...c, ...updatedItem } : c));
        },
        onInsert: (newItem) => {
            fetchLTVData();
        }
    });

    useEffect(() => {
        fetchLTVData();
    }, [selectedSegment]);

    const fetchLTVData = async () => {
        try {
            const params = new URLSearchParams();
            if (selectedSegment !== "all") {
                params.append("segment", selectedSegment);
            }

            const response = await fetch(`/api/customers/ltv?${params}`);

            if (!response.ok) {
                throw new Error("Failed to fetch LTV data");
            }

            const data = await response.json();

            setCustomers(data.customers || []);
            setSegments(data.segments || []);
        } catch (error) {
            console.error("Error fetching LTV data:", error);
            toast.error("Failed to load LTV data");
        } finally {
            setLoading(false);
        }
    };

    const getSegmentColor = (segment: string) => {
        const colors: Record<string, string> = {
            "high_value": "bg-purple-500/20 text-purple-400 border-purple-500/30",
            "growing": "bg-green-500/20 text-green-400 border-green-500/30",
            "at_risk": "bg-orange-500/20 text-orange-400 border-orange-500/30",
            "churned": "bg-red-500/20 text-red-400 border-red-500/30",
            "new": "bg-blue-500/20 text-blue-400 border-blue-500/30",
        };
        return colors[segment] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
    };

    const getChurnRiskColor = (level: string) => {
        const colors: Record<string, string> = {
            "low": "text-green-400",
            "medium": "text-yellow-400",
            "high": "text-orange-400",
            "critical": "text-red-400",
        };
        return colors[level] || "text-gray-400";
    };

    const generateAiRetentionStrategy = async () => {
        setIsAiLoading(true);
        try {
            const res = await fetch("/api/ai/admin-command", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    command: "Analyze customer LTV segments and suggest retention strategies for 'at_risk' customers and upsell opportunities for 'high_value' customers.",
                    context: {
                        type: "ltv_analysis",
                        segments: segments,
                        top_customers: customers.slice(0, 5).map(c => ({
                            name: c.user?.full_name,
                            ltv: c.actual_ltv,
                            risk: c.churn_risk_level
                        }))
                    }
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setAiInsight(data.response);
            }
        } finally {
            setIsAiLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#0a0a0a]">

                <div className="flex-1 p-8 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[#ff1744] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[#888] font-mono text-sm">Calculating customer value...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white">

            <div className="flex-1 p-4 lg:p-8 overflow-auto pb-24 lg:pb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black tracking-tighter flex items-center gap-3">
                            <Crown className="text-[#ff1744]" />
                            Value Optics
                        </h1>
                        <p className="text-[#888] mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                            Customer Equity Engine
                        </p>
                    </div>
                </div>

                {/* AI Retention Engine */}
                <div className="glass-card rounded-2xl lg:rounded-[2rem] p-6 lg:p-8 border border-white/5 bg-gradient-to-br from-[#1a1a1a] to-transparent relative overflow-hidden mb-8 group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px]" />
                    <div className="flex flex-col lg:flex-row items-start justify-between gap-6 lg:gap-8 relative z-10">
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                    <Brain className="text-white" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tighter">AI Retention Strategist</h3>
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Churn Prediction & Upsell</p>
                                </div>
                            </div>

                            <div className="p-4 lg:p-6 rounded-2xl bg-black/20 border border-white/5 min-h-[100px] text-sm leading-relaxed text-[#ccc] font-medium backdrop-blur-sm">
                                {isAiLoading ? (
                                    <div className="flex items-center gap-3 text-purple-400">
                                        <Sparkles className="animate-spin" size={18} />
                                        <span className="text-xs uppercase tracking-widest">Processing behavioral data...</span>
                                    </div>
                                ) : aiInsight ? (
                                    <div className="text-sm text-[#ccc] whitespace-pre-line leading-relaxed">
                                        {aiInsight}
                                    </div>
                                ) : (
                                    "Ready to analyze customer value and predict churn risks."
                                )}
                            </div>
                        </div>
                        <button
                            onClick={generateAiRetentionStrategy}
                            className="w-full lg:w-32 lg:h-32 py-4 lg:py-0 rounded-2xl lg:rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex lg:flex-col items-center justify-center gap-3 lg:gap-2 group/btn"
                        >
                            <Zap size={24} className="text-purple-500 group-hover/btn:scale-110 transition-transform lg:w-8 lg:h-8" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#888] group-hover/btn:text-white">Analyze LTV</span>
                        </button>
                    </div>
                </div>

                {/* Segment Filter */}
                <div className="flex overflow-x-auto pb-4 gap-3 mb-8 scrollbar-hide no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
                    {segments.map((segment) => (
                        <button
                            key={segment.segment_name}
                            onClick={() => setSelectedSegment(segment.segment_name)}
                            className={`flex-shrink-0 min-w-[150px] glass-card rounded-2xl border-2 p-4 text-left transition-all ${selectedSegment === segment.segment_name
                                ? getSegmentColor(segment.segment_name)
                                : "border-white/5 bg-white/[0.02]"
                                }`}
                        >
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">
                                {segment.segment_name.replace("_", " ")}
                            </p>
                            <p className="text-2xl font-black tracking-tighter">{segment.customer_count}</p>
                            <div className="flex items-center gap-1 mt-2 text-[10px] font-mono opacity-50">
                                <ArrowUpRight size={10} />
                                LTV: ₹{Math.round(segment.avg_ltv).toLocaleString()}
                            </div>
                        </button>
                    ))}
                    <button
                        onClick={() => setSelectedSegment("all")}
                        className={`flex-shrink-0 min-w-[150px] glass-card rounded-2xl border-2 p-4 text-left transition-all ${selectedSegment === "all"
                            ? "bg-white/10 border-white text-white"
                            : "border-white/5 bg-white/[0.02]"
                            }`}
                    >
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">ALL SEGMENTS</p>
                        <p className="text-2xl font-black tracking-tighter">{segments.reduce((acc, curr) => acc + curr.customer_count, 0)}</p>
                        <div className="flex items-center gap-1 mt-2 text-[10px] font-mono opacity-50">
                            <TrendingUp size={10} /> Total Base
                        </div>
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Total LTV", value: `₹${customers.reduce((sum, c) => sum + c.actual_ltv, 0).toLocaleString()}`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
                        { label: "Avg Value", value: `₹${customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + c.actual_ltv, 0) / customers.length).toLocaleString() : 0}`, icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
                        { label: "VIP Base", value: customers.filter((c) => c.is_vip).length, icon: Crown, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { label: "High Risk", value: customers.filter((c) => c.churn_risk_level === "high" || c.churn_risk_level === "critical").length, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
                    ].map((stat, i) => (
                        <div key={i} className="glass-card rounded-2xl p-4 lg:p-6 border border-white/5 flex items-center gap-3 lg:gap-4">
                            <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0`}>
                                <stat.icon size={20} className="lg:w-6 lg:h-6" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-lg lg:text-2xl font-black tracking-tighter truncate">{stat.value}</div>
                                <div className="text-[10px] font-black text-[#555] uppercase tracking-widest">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Portfolio */}
                <div className="glass-card rounded-2xl lg:rounded-[2rem] overflow-hidden border border-white/5">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h3 className="font-bold text-lg">Customer Portfolio</h3>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-[10px] lg:text-xs text-[#666] uppercase tracking-widest font-bold">Live Context</span>
                        </div>
                    </div>

                    {/* Mobile Card List */}
                    <div className="lg:hidden divide-y divide-white/5">
                        {customers.map((customer) => (
                            <div key={customer.user_id} className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white font-bold">
                                            {(customer.user?.full_name || "U").charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm flex items-center gap-1.5">
                                                {customer.user?.full_name}
                                                {customer.is_vip && <Crown size={12} className="text-[#d4af37]" />}
                                            </p>
                                            <p className="text-[10px] text-[#666]">{customer.user?.email}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${getSegmentColor(customer.customer_segment)}`}>
                                        {customer.customer_segment.replace("_", " ")}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[8px] text-[#555] uppercase font-bold mb-1">Lifetime Value</p>
                                        <p className="text-sm font-bold">₹{customer.actual_ltv.toLocaleString()}</p>
                                        <p className="text-[10px] text-purple-400">Pred: ₹{customer.predicted_ltv.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] text-[#555] uppercase font-bold mb-1">Activity</p>
                                        <p className="text-sm font-bold">{customer.total_bookings} Bookings</p>
                                        <p className="text-[10px] text-[#666]">Avg: ₹{Math.round(customer.average_booking_value).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${customer.churn_risk_level === 'low' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className={`text-[10px] font-black uppercase ${getChurnRiskColor(customer.churn_risk_level)}`}>{customer.churn_risk_level} Risk</span>
                                    </div>
                                    <span className="text-[10px] font-black text-[#555] uppercase">{customer.loyalty_tier}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-black/20 text-left">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Customer</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Segment</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Value Dynamics</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Retention Risk</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Tier</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {customers.map((customer) => (
                                    <tr key={customer.user_id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold">
                                                    {(customer.user?.full_name || "U").charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold flex items-center gap-2">
                                                        {customer.user?.full_name}
                                                        {customer.is_vip && <Crown size={14} className="text-[#d4af37]" />}
                                                    </p>
                                                    <p className="text-xs text-[#666]">{customer.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getSegmentColor(customer.customer_segment)}`}>
                                                {customer.customer_segment.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold">₹{customer.actual_ltv.toLocaleString()}</p>
                                            <p className="text-[10px] text-[#666]">Avg: ₹{customer.average_booking_value.toLocaleString()}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-2 h-2 rounded-full ${customer.churn_risk_level === 'low' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className={`text-[10px] font-black uppercase ${getChurnRiskColor(customer.churn_risk_level)}`}>{customer.churn_risk_level} Risk</span>
                                            </div>
                                            <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className={`h-full ${customer.churn_risk_level === 'low' ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${customer.churn_risk_score * 100}%` }} />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-black uppercase text-[#888]">{customer.loyalty_tier}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {customers.length === 0 && (
                        <div className="text-center py-20">
                            <Users size={40} className="mx-auto mb-4 opacity-10" />
                            <p className="text-[#666] font-bold">No customers in this segment</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
