"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Users, AlertTriangle, Crown, DollarSign, Sparkles, Brain, Zap, Target, Activity, BarChart3, PieChart, ArrowUpRight } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
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
            // Ideally fetch the full user profile here, but for now just trigger a reload or ignore until refresh
            // since we need the join.
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
                <AdminSidebar />
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
            <AdminSidebar />
            <div className="flex-1 p-4 lg:p-8 overflow-auto">
                {/* Header Upgrade */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
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
                <div className="glass-card rounded-[2rem] p-8 border border-white/5 bg-gradient-to-br from-[#1a1a1a] to-transparent relative overflow-hidden mb-8 group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px]" />
                    <div className="flex items-start justify-between gap-8 relative z-10">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                    <Brain className="text-white" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tighter">AI Retention Strategist</h3>
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Churn Prediction & Upsell</p>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-black/20 border border-white/5 min-h-[100px] text-sm leading-relaxed text-[#ccc] font-medium backdrop-blur-sm">
                                {isAiLoading ? (
                                    <div className="flex items-center gap-3 text-purple-400">
                                        <Sparkles className="animate-spin" size={18} />
                                        <span className="text-xs uppercase tracking-widest">Processing behavioral data...</span>
                                    </div>
                                ) : aiInsight ? (
                                    <div className="prose prose-invert max-w-none">
                                        {aiInsight}
                                    </div>
                                ) : (
                                    "Ready to analyze customer value and predict churn risks."
                                )}
                            </div>
                        </div>
                        <button
                            onClick={generateAiRetentionStrategy}
                            className="hidden md:flex flex-col items-center justify-center w-32 h-32 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group/btn"
                        >
                            <Zap size={32} className="text-purple-500 mb-2 group-hover/btn:scale-110 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#888] group-hover/btn:text-white">Analyze<br />LTV</span>
                        </button>
                    </div>
                </div>

                {/* Segment Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    {segments.map((segment) => (
                        <button
                            key={segment.segment_name}
                            onClick={() => setSelectedSegment(segment.segment_name)}
                            className={`glass-card rounded-2xl border-2 p-4 text-left transition-all hover:scale-105 active:scale-95 ${selectedSegment === segment.segment_name
                                ? getSegmentColor(segment.segment_name)
                                : "border-white/5 bg-white/[0.02]"
                                }`}
                        >
                            <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">
                                {segment.segment_name.replace("_", " ")}
                            </p>
                            <p className="text-2xl font-black tracking-tighter">{segment.customer_count}</p>
                            <div className="flex items-center gap-1 mt-2 text-xs font-mono opacity-50">
                                <ArrowUpRight size={12} />
                                LTV: ₹{segment.avg_ltv?.toLocaleString() || 0}
                            </div>
                        </button>
                    ))}
                    <button
                        onClick={() => setSelectedSegment("all")}
                        className={`glass-card rounded-2xl border-2 p-4 text-left transition-all hover:scale-105 active:scale-95 ${selectedSegment === "all"
                            ? "bg-white/10 border-white text-white"
                            : "border-white/5 bg-white/[0.02]"
                            }`}
                    >
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">
                            ALL SEGMENTS
                        </p>
                        <p className="text-2xl font-black tracking-tighter">{segments.reduce((acc, curr) => acc + curr.customer_count, 0)}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs font-mono opacity-50">
                            <TrendingUp size={12} />
                            Total Base
                        </div>
                    </button>
                </div>

                {/* Stats Overview - Premium Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: "Total Lifetime Value", value: `₹${customers.reduce((sum, c) => sum + c.actual_ltv, 0).toLocaleString()}`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
                        { label: "Avg Customer Value", value: `₹${customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + c.actual_ltv, 0) / customers.length).toLocaleString() : 0}`, icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
                        { label: "Elite VIP Members", value: customers.filter((c) => c.is_vip).length, icon: Crown, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { label: "High Risk Churn", value: customers.filter((c) => c.churn_risk_level === "high" || c.churn_risk_level === "critical").length, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group"
                        >
                            <div className="relative flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <div className="text-2xl font-black tracking-tighter">{stat.value}</div>
                                    <div className="text-[10px] font-black text-[#555] uppercase tracking-widest">{stat.label}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Customers Table - Premium */}
                <div className="glass-card rounded-[2rem] overflow-hidden border border-white/5">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h3 className="font-bold text-lg">Customer Portfolio</h3>
                        <div className="flex gap-2">
                            <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-xs text-[#666] uppercase tracking-widest font-bold">Real-time Analysis</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-black/20">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Customer</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Segment</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Value</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Velocity</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Risk Factor</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {customers.map((customer) => (
                                    <tr key={customer.user_id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                {customer.is_vip && <Crown size={16} className="text-[#d4af37]" />}
                                                <div>
                                                    <p className="font-bold text-base mb-1">
                                                        {customer.user?.full_name || "Unknown"}
                                                    </p>
                                                    <p className="text-[10px] text-[#666] uppercase tracking-widest">{customer.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getSegmentColor(
                                                    customer.customer_segment
                                                )}`}
                                            >
                                                {customer.customer_segment.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-white mb-1">
                                                ₹{customer.actual_ltv.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-[#666] font-mono">
                                                Pred: ₹{customer.predicted_ltv.toLocaleString()}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-white">{customer.total_bookings} <span className="text-xs font-normal text-[#666]">bookings</span></p>
                                            <p className="text-xs text-[#666]">
                                                Avg: ₹{customer.average_booking_value.toLocaleString()}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${customer.churn_risk_level === 'low' ? 'bg-green-500' : customer.churn_risk_level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${getChurnRiskColor(customer.churn_risk_level)}`}>
                                                    {customer.churn_risk_level} ({(customer.churn_risk_score * 100).toFixed(0)}%)
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#aaa]">{customer.loyalty_tier}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {customers.length === 0 && (
                            <div className="text-center py-20 text-[#666]">
                                <Users size={48} className="mx-auto mb-6 opacity-20" />
                                <p className="text-lg font-bold">No customers found</p>
                                <p className="text-sm">Try selecting a different segment</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
