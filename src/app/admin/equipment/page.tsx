"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
    Sparkles,
    Activity,
    ShieldAlert,
    Zap,
    Layers,
    RefreshCw,
    Plus,
    CheckCircle2,
    Calendar,
    TrendingDown
} from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Equipment {
    id: string;
    name: string;
    equipment_type: string;
    location: string;
    is_active: boolean;
    current_condition: string;
    next_maintenance_due: string;
    total_maintenance_cost: number;
}

interface MaintenanceAlert {
    id: string;
    equipment_name: string;
    priority: string;
    message: string;
    due_date: string;
}

export default function EquipmentAdminPage() {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiInsight, setAiInsight] = useState<string>("");
    const [isAiLoading, setIsAiLoading] = useState(false);
    const router = useRouter();

    // Real-time subscription
    useRealtimeSubscription({
        table: "equipment",
        onUpdate: (updatedEq) => {
            setEquipment((prev) => prev.map((e) => (e.id === updatedEq.id ? updatedEq : e)));
        },
        onInsert: (newEq) => {
            setEquipment((prev) => [...prev, newEq]);
            toast.success("New equipment logged!");
        },
        onDelete: (payload) => {
            setEquipment((prev) => prev.filter((e) => e.id !== payload.old.id));
        },
    });

    useEffect(() => {
        fetchEquipment();
        generateAiInsights();
    }, []);

    const fetchEquipment = async () => {
        try {
            const response = await fetch("/api/equipment");
            if (!response.ok) throw new Error("Failed to fetch equipment");
            const data = await response.json();
            setEquipment(data.equipment || []);
            setAlerts(data.alerts || []);
        } catch (error) {
            console.error("Error fetching equipment:", error);
            toast.error("Failed to load equipment data");
        } finally {
            setLoading(false);
        }
    };

    const generateAiInsights = async () => {
        setIsAiLoading(true);
        try {
            const res = await fetch("/api/ai/admin-command", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    command: "Analyze our equipment health and maintenance logs. Predict which specific items are at risk of failure in the next 30 days.",
                    context: { type: "equipment", current_inventory: equipment, alerts: alerts }
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setAiInsight(data.response);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsAiLoading(false);
        }
    };

    const getConditionColor = (condition: string) => {
        const colors: Record<string, string> = {
            excellent: "bg-green-500/20 text-green-400 border border-green-500/30",
            good: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
            fair: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
            poor: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
            critical: "bg-red-500/20 text-red-400 border border-red-500/30",
        };
        return colors[condition] || "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: "text-green-400",
            medium: "text-yellow-400",
            high: "text-orange-400",
            critical: "text-red-400",
        };
        return colors[priority] || "text-gray-400";
    };

    const isDueForMaintenance = (dueDate: string) => {
        const daysUntilDue = Math.floor(
            (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilDue <= 7;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#0a0a0a]">
                <AdminSidebar />
                <div className="flex-1 p-8 space-y-4">
                    <div className="w-12 h-12 border-4 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto mt-20" />
                    <div className="text-center text-[#888] font-black uppercase tracking-widest text-[10px]">Syncing Logistics...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white">
            <AdminSidebar />
            <div className="flex-1 p-8 space-y-8 overflow-auto max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                            <Activity className="text-[#ff1744]" />
                            Equipment Hub
                        </h1>
                        <p className="text-[#888] mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Live Asset Monitoring Active
                        </p>
                    </div>
                    <button className="btn-premium px-8 py-4 rounded-2xl text-white font-black flex items-center gap-3 shadow-xl shadow-[#ff1744]/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <Plus size={20} />
                        Register Unit
                    </button>
                </div>

                {/* AI Predictor Insight */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card rounded-[2.5rem] p-6 border border-[#ff1744]/20 bg-[#ff1744]/5 relative overflow-hidden group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-[#ff1744] to-[#d4af37] rounded-xl shadow-lg shadow-[#ff1744]/20">
                            <Sparkles size={24} className="text-white fill-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">AI Maintenance Predictor</h2>
                            <p className="text-xs text-[#888] uppercase font-bold tracking-widest">Failure prevention engine</p>
                        </div>
                        <button onClick={generateAiInsights} className="ml-auto p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                            <RefreshCw size={16} className={isAiLoading ? "animate-spin" : ""} />
                        </button>
                    </div>
                    <div className="text-sm leading-relaxed text-[#ccc] min-h-[40px] italic">
                        {isAiLoading ? "Analyzing vibration patterns and thermal wear..." : aiInsight || "Refresh to run health scan."}
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: "Total Units", value: equipment.length, icon: Layers, color: "text-blue-500" },
                                { label: "Operational", value: equipment.filter((e) => e.is_active).length, icon: CheckCircle2, color: "text-green-500" },
                            ].map((stat, i) => (
                                <div key={i} className="glass-card rounded-[1.5rem] p-6 border border-white/5 flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} shadow-lg`}>
                                        <stat.icon size={28} />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black tracking-tighter">{stat.value}</div>
                                        <div className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em]">{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Equipment Table */}
                        <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-xl font-bold">Asset Inventory</h2>
                                <div className="text-[10px] font-black uppercase tracking-widest text-[#444]">Real-time Sync Active</div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/[0.02]">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[#888] uppercase tracking-widest">Unit</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[#888] uppercase tracking-widest">Condition</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[#888] uppercase tracking-widest">Next Due</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[#888] uppercase tracking-widest">Cost Center</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                        {equipment.map((item) => (
                                            <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-2 h-2 rounded-full ${item.is_active ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`} />
                                                        <div>
                                                            <p className="font-bold text-white group-hover:text-[#ff1744] transition-colors">{item.name}</p>
                                                            <p className="text-[10px] text-[#444] font-bold uppercase tracking-widest">{item.equipment_type.replace("_", " ")} • {item.location}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getConditionColor(item.current_condition)}`}>
                                                        {item.current_condition}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-white">{new Date(item.next_maintenance_due).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                                                        {isDueForMaintenance(item.next_maintenance_due) && (
                                                            <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter mt-1 animate-pulse flex items-center gap-1">
                                                                <ShieldAlert size={10} /> Critical Window
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="text-sm font-black tracking-tight text-white">₹{item.total_maintenance_cost.toLocaleString()}</div>
                                                    <div className="text-[10px] text-[#444] font-bold uppercase tracking-widest">Total Sunk</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Maintenance Highlights */}
                        <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 space-y-6">
                            <h3 className="text-sm font-black text-[#888] uppercase tracking-[0.3em] ml-1">Critical Zones</h3>
                            <div className="space-y-4">
                                <div className="p-6 rounded-[2rem] bg-red-500/5 border border-red-500/20">
                                    <div className="flex items-center gap-3 mb-2 text-red-500">
                                        <Calendar size={18} />
                                        <span className="text-xl font-black">{equipment.filter((e) => isDueForMaintenance(e.next_maintenance_due)).length}</span>
                                    </div>
                                    <p className="text-[10px] font-black text-[#888] uppercase tracking-widest">Units Flagged for Service</p>
                                </div>
                                <div className="p-6 rounded-[2rem] bg-[#d4af37]/5 border border-[#d4af37]/20">
                                    <div className="flex items-center gap-3 mb-2 text-[#d4af37]">
                                        <TrendingDown size={18} />
                                        <span className="text-xl font-black">₹{equipment.reduce((sum, e) => sum + e.total_maintenance_cost, 0).toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] font-black text-[#888] uppercase tracking-widest">Operational Burn Rate</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Alerts */}
                        <div className="glass-card rounded-[2.5rem] p-8 border border-white/5">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-black text-[#888] uppercase tracking-[0.3em] ml-1">Live Feed</h3>
                                <Zap size={14} className="text-[#ff1744] animate-pulse" />
                            </div>
                            <div className="space-y-4">
                                {alerts.length > 0 ? alerts.slice(0, 5).map((alert) => (
                                    <div key={alert.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-default group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-black text-white group-hover:text-[#ff1744]">{alert.equipment_name}</span>
                                            <span className={`text-[8px] font-black uppercase ${getPriorityColor(alert.priority)}`}>{alert.priority}</span>
                                        </div>
                                        <p className="text-[11px] text-[#666] leading-tight mb-2 line-clamp-1">{alert.message}</p>
                                        <div className="text-[9px] text-[#444] font-bold">DUE: {new Date(alert.due_date).toLocaleDateString()}</div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 opacity-20">
                                        <CheckCircle2 size={32} className="mx-auto mb-2" />
                                        <p className="text-[10px] font-black uppercase">All Systems Nominal</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
