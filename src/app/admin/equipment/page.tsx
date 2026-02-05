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
    TrendingDown,
    X,
    ChevronRight,
    MapPin,
    Toolbox
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
    const [showRegisterModal, setShowRegisterModal] = useState(false);
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
    }, []);

    const fetchEquipment = async () => {
        try {
            const response = await fetch("/api/equipment");
            if (!response.ok) throw new Error("Failed to fetch equipment");
            const data = await response.json();
            setEquipment(data.equipment || []);
            setAlerts(data.alerts || []);
        } catch (error) {
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
        } finally {
            setIsAiLoading(false);
        }
    };

    const getConditionColor = (condition: string) => {
        switch (condition) {
            case 'excellent': return "text-green-400 bg-green-400/10 border-green-400/20";
            case 'good': return "text-blue-400 bg-blue-400/10 border-blue-400/20";
            case 'fair': return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
            case 'poor': return "text-orange-400 bg-orange-400/10 border-orange-400/20";
            case 'critical': return "text-red-400 bg-red-400/10 border-red-400/20";
            default: return "text-slate-400 bg-white/5 border-white/10";
        }
    };

    const isDueForMaintenance = (dueDate: string) => {
        const daysUntilDue = Math.floor((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue <= 7;
    };

    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white">
            <div className="flex-1 overflow-auto pb-24 lg:pb-8">
                <div className="p-4 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-black tracking-tighter flex items-center gap-3">
                                <Activity className="text-[#ff1744]" />
                                Equipment Hub
                            </h1>
                            <p className="text-[#888] mt-1 flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Live Asset Monitoring
                            </p>
                        </div>
                        <button
                            onClick={() => setShowRegisterModal(true)}
                            className="w-full md:w-auto btn-premium px-8 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#ff1744]/20 transition-all hover:scale-[1.02]"
                        >
                            <Plus size={18} />
                            Register Unit
                        </button>
                    </div>

                    {/* AI Predictor Insight */}
                    <div className="glass-card rounded-[2rem] p-6 lg:p-10 border border-[#ff1744]/20 bg-[#ff1744]/5 relative overflow-hidden mb-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff1744]/5 rounded-full blur-[80px]" />
                        <div className="flex flex-col md:flex-row items-start justify-between gap-8 relative z-10">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-gradient-to-br from-[#ff1744] to-[#fb8c00] rounded-2xl shadow-lg shadow-[#ff1744]/20">
                                        <Sparkles size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black tracking-tighter">AI Health Predictor</h3>
                                        <p className="text-[10px] font-black text-[#555] uppercase tracking-widest mt-1">Failure Prevention System</p>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-black/20 border border-white/5 min-h-[100px] text-sm leading-relaxed text-[#ccc] font-medium backdrop-blur-sm">
                                    {isAiLoading ? (
                                        <div className="flex items-center gap-3 text-[#ff1744]">
                                            <RefreshCw className="animate-spin" size={18} />
                                            <span className="text-xs font-black uppercase tracking-widest">Scanning vibration patterns...</span>
                                        </div>
                                    ) : aiInsight ? (
                                        <div className="prose prose-invert max-w-none text-xs lg:text-sm">
                                            {aiInsight}
                                        </div>
                                    ) : (
                                        <p className="text-[#444] italic">Initiate health scan to analyze acoustic and thermal sensor data.</p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={generateAiInsights}
                                className="w-full md:w-32 h-32 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-2 group"
                            >
                                <Zap size={32} className="text-[#ff1744] group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#888] text-center">Run<br />Health Scan</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Stats Overview */}
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "Asset Count", value: equipment.length, icon: Toolbox, color: "text-blue-500", bg: "bg-blue-500/10" },
                                    { label: "Operational", value: equipment.filter(e => e.is_active).length, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-400/10" },
                                ].map((stat, i) => (
                                    <div key={i} className="glass-card rounded-2xl p-4 lg:p-6 border border-white/5 flex items-center gap-4">
                                        <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                            <stat.icon size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-lg lg:text-xl font-black tracking-tighter truncate">{stat.value}</div>
                                            <div className="text-[8px] lg:text-[10px] font-black text-[#555] uppercase tracking-widest">{stat.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Equipment List */}
                            <div className="glass-card rounded-3xl lg:rounded-[2.5rem] p-4 lg:p-8 border border-white/5">
                                <div className="flex items-center justify-between mb-8 px-2">
                                    <h3 className="text-[10px] font-black text-[#555] uppercase tracking-[0.3em]">Asset Registry</h3>
                                    <div className="text-[8px] font-black text-[#555] uppercase tracking-widest">Live Sync</div>
                                </div>

                                {loading ? (
                                    <div className="py-20 text-center"><RefreshCw className="animate-spin mx-auto text-[#222]" /></div>
                                ) : equipment.length === 0 ? (
                                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                        <p className="text-[10px] font-black uppercase text-[#444] tracking-widest">Registry empty</p>
                                    </div>
                                ) : (
                                    <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
                                        {equipment.map((item) => (
                                            <motion.div key={item.id} layout className="rounded-3xl bg-white/[0.02] border border-white/5 p-6 hover:border-[#ff1744]/30 transition-all flex flex-col">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="min-w-0">
                                                        <h4 className="text-lg font-black tracking-tighter truncate mb-1">{item.name}</h4>
                                                        <div className="flex items-center gap-2 text-[8px] font-black text-[#555] uppercase tracking-widest">
                                                            <MapPin size={8} /> {item.location}
                                                        </div>
                                                    </div>
                                                    <div className={`w-2 h-2 rounded-full ${item.is_active ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                                                </div>

                                                <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-4">
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                        <span className="text-[#333]">Status</span>
                                                        <span className={`px-2 py-0.5 rounded-lg border ${getConditionColor(item.current_condition)}`}>{item.current_condition}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                        <span className="text-[#333]">Sunk Cost</span>
                                                        <span className="text-white">₹{item.total_maintenance_cost.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                        <span className="text-[#333]">Next Sync</span>
                                                        <span className={`text-white ${isDueForMaintenance(item.next_maintenance_due) ? "text-red-500 font-bold" : ""}`}>
                                                            {new Date(item.next_maintenance_due).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Critical Insights */}
                            <div className="glass-card rounded-3xl p-6 lg:p-8 border border-white/5 space-y-6">
                                <h3 className="text-[10px] font-black text-[#555] uppercase tracking-[0.3em]">Critical Insights</h3>
                                <div className="space-y-4">
                                    <div className="p-6 rounded-[2rem] bg-red-500/5 border border-red-500/20">
                                        <div className="text-2xl font-black text-red-500 mb-1">{equipment.filter(e => isDueForMaintenance(e.next_maintenance_due)).length}</div>
                                        <div className="text-[10px] font-black text-[#888] uppercase tracking-widest">Action Required</div>
                                    </div>
                                    <div className="p-6 rounded-[2rem] bg-[#d4af37]/5 border border-[#d4af37]/20">
                                        <div className="text-2xl font-black text-[#d4af37] mb-1">₹{equipment.reduce((s, e) => s + e.total_maintenance_cost, 0).toLocaleString()}</div>
                                        <div className="text-[10px] font-black text-[#888] uppercase tracking-widest">OpEx Burn</div>
                                    </div>
                                </div>
                            </div>

                            {/* Maintenance Logs */}
                            <div className="glass-card rounded-3xl p-6 lg:p-8 border border-white/5">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-[10px] font-black text-[#555] uppercase tracking-[0.3em]">Log Feed</h3>
                                    <Activity size={12} className="text-[#ff1744] animate-pulse" />
                                </div>
                                <div className="space-y-3">
                                    {alerts.length > 0 ? alerts.slice(0, 5).map((alert) => (
                                        <div key={alert.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex flex-col gap-2">
                                            <div className="flex justify-between items-center font-black uppercase text-[8px] tracking-widest">
                                                <span className="text-white truncate max-w-[120px]">{alert.equipment_name}</span>
                                                <span className={alert.priority === 'critical' || alert.priority === 'high' ? 'text-red-500' : 'text-[#555]'}>{alert.priority}</span>
                                            </div>
                                            <p className="text-[10px] text-[#666] leading-relaxed line-clamp-2">{alert.message}</p>
                                        </div>
                                    )) : (
                                        <div className="py-10 text-center opacity-10">
                                            <Calendar size={32} className="mx-auto" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Register Modal - Bottom Sheet */}
            <AnimatePresence>
                {showRegisterModal && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-md" onClick={() => setShowRegisterModal(false)}>
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-2xl bg-[#0d0d0d] rounded-t-[3rem] sm:rounded-[3rem] p-8 lg:p-12 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tighter">Register Asset</h2>
                                    <p className="text-[10px] font-black text-[#555] uppercase tracking-widest mt-1">Add Unit to Registry</p>
                                </div>
                                <button onClick={() => setShowRegisterModal(false)} className="p-3 bg-white/5 border border-white/5 rounded-2xl"><X size={24} /></button>
                            </div>

                            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); toast.info("Implementation pending backend bridge."); setShowRegisterModal(false); }}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Asset Name</label>
                                        <input required className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] font-bold" placeholder="e.g. High-Pressure Washer V2" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Location Node</label>
                                        <input required className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] font-bold" placeholder="Bay 1 / Storage A" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Category</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] font-black uppercase text-[10px] tracking-widest appearance-none">
                                            <option>Heavy Machinery</option>
                                            <option>Hand Tools</option>
                                            <option>Electronic Node</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Maintenance Window</label>
                                        <input type="date" required className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] font-bold" />
                                    </div>
                                </div>

                                <div className="pt-8 flex gap-4">
                                    <button type="button" onClick={() => setShowRegisterModal(false)} className="flex-1 py-5 rounded-2xl bg-white/5 text-[#444] font-black uppercase text-[10px] tracking-widest">Abort</button>
                                    <button type="submit" className="flex-[2] py-5 rounded-2xl btn-premium text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#ff1744]/20 transition-all hover:scale-[1.02]">
                                        Authorize Unit
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
