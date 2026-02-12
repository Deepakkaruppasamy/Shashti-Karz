"use client";

import { useState, useEffect } from "react";
import { Send, Users, Calendar, TrendingUp, Eye, Plus, Sparkles, Brain, Zap, Target, MessageCircle, BarChart3, X, ChevronRight, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { BrandedLoader } from "@/components/animations/BrandedLoader";
import { motion, AnimatePresence } from "framer-motion";

interface Campaign {
    id: string;
    name: string;
    campaign_type: string;
    trigger_type: string;
    status: string;
    total_recipients: number;
    sent_count: number;
    opened_count: number;
    clicked_count: number;
    converted_count: number;
    created_at: string;
}

export default function CampaignsAdminPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [aiInsight, setAiInsight] = useState<string>("");
    const [isAiLoading, setIsAiLoading] = useState(false);

    // New Campaign Form State
    const [newCampaign, setNewCampaign] = useState({
        name: "",
        campaign_type: "email",
        trigger_type: "manual",
        subject: "",
        content: ""
    });

    const router = useRouter();

    // Real-time subscription
    useRealtimeSubscription<Campaign>({
        table: "marketing_campaigns",
        onInsert: (newItem) => {
            setCampaigns(prev => [newItem, ...prev]);
            toast.success(`New Campaign Created: ${newItem.name}`);
        },
        onUpdate: (updatedItem) => {
            setCampaigns(prev => prev.map(c => c.id === updatedItem.id ? updatedItem : c));
        },
        onDelete: (deletedItem) => {
            setCampaigns(prev => prev.filter(c => c.id !== deletedItem.old.id));
        }
    });

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const response = await fetch("/api/campaigns");
            if (!response.ok) throw new Error("Failed to fetch campaigns");
            const data = await response.json();
            setCampaigns(data.campaigns || []);
        } catch (error) {
            toast.error("Failed to load campaigns");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return "text-green-500 bg-green-500/10 border-green-500/20";
            case 'scheduled': return "text-blue-500 bg-blue-500/10 border-blue-500/20";
            case 'completed': return "text-purple-500 bg-purple-500/10 border-purple-500/20";
            default: return "text-slate-500 bg-white/5 border-white/10";
        }
    };

    const calculateOpenRate = (campaign: Campaign) => (campaign.sent_count === 0 ? 0 : Math.round((campaign.opened_count / campaign.sent_count) * 100));
    const calculateClickRate = (campaign: Campaign) => (campaign.opened_count === 0 ? 0 : Math.round((campaign.clicked_count / campaign.opened_count) * 100));
    const calculateConversionRate = (campaign: Campaign) => (campaign.sent_count === 0 ? 0 : Math.round((campaign.converted_count / campaign.sent_count) * 100));

    const generateAiStrategy = async () => {
        setIsAiLoading(true);
        try {
            const res = await fetch("/api/ai/admin-command", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    command: "Analyze past campaign performance and suggest a new high-conversion campaign strategy for the upcoming weekend. Focus on retention.",
                    context: {
                        type: "marketing_strategy",
                        past_campaigns: campaigns.slice(0, 5).map(c => ({ name: c.name, type: c.campaign_type, conversion: c.converted_count }))
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

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCampaign)
            });

            if (res.ok) {
                toast.success("Campaign launched successfully!");
                setShowCreateForm(false);
                setNewCampaign({ name: "", campaign_type: "email", trigger_type: "manual", subject: "", content: "" });
                fetchCampaigns();
            } else {
                toast.error("Failed to launch campaign");
            }
        } catch (e) {
            toast.error("Error creating campaign");
        }
    };

    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white">
            <div className="flex-1 overflow-auto pb-24 lg:pb-8">
                <div className="p-4 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-black tracking-tighter flex items-center gap-3">
                                <Target className="text-[#ff1744]" />
                                Growth Engine
                            </h1>
                            <p className="text-[#888] mt-1 flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                Active Campaign Monitors
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="w-full md:w-auto btn-premium px-8 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#ff1744]/20 transition-all hover:scale-[1.02]"
                        >
                            <Plus size={18} />
                            Launch Campaign
                        </button>
                    </div>

                    {/* AI Strategist Section */}
                    <div className="glass-card rounded-[2rem] p-6 lg:p-10 border border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/5 to-transparent relative overflow-hidden mb-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-[80px]" />
                        <div className="flex flex-col md:flex-row items-start justify-between gap-8 relative z-10">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center shadow-lg shadow-[#ff1744]/20">
                                        <Brain className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black tracking-tighter">AI Marketing Strategist</h3>
                                        <p className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest">Predictive Growth Analysis</p>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-black/20 border border-white/5 min-h-[100px] text-sm leading-relaxed text-[#ccc] font-medium backdrop-blur-sm">
                                    {isAiLoading ? (
                                        <div className="flex items-center gap-3 text-[#d4af37]">
                                            <Sparkles className="animate-spin" size={18} />
                                            <span className="text-xs font-black uppercase tracking-widest">Analyzing customer segments...</span>
                                        </div>
                                    ) : aiInsight ? (
                                        <div className="prose prose-invert max-w-none text-xs lg:text-sm">
                                            {aiInsight}
                                        </div>
                                    ) : (
                                        <p className="text-[#666]">Ready to analyze campaign performance and suggest optimization strategies.</p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={generateAiStrategy}
                                className="w-full md:w-32 h-32 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-2 group"
                            >
                                <Zap size={32} className="text-[#d4af37] group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#888] text-center">Generate<br />Insight</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: "Sequences", value: campaigns.length, icon: Send, color: "text-blue-500", bg: "bg-blue-500/10" },
                            { label: "Total Reach", value: campaigns.reduce((sum, c) => sum + c.sent_count, 0).toLocaleString(), icon: Users, color: "text-green-500", bg: "bg-green-500/10" },
                            { label: "Avg Open Rate", value: `${Math.round(campaigns.reduce((sum, c) => sum + calculateOpenRate(c), 0) / (campaigns.length || 1))}%`, icon: Eye, color: "text-purple-500", bg: "bg-purple-500/10" },
                            { label: "Conversions", value: campaigns.reduce((sum, c) => sum + c.converted_count, 0), icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10" },
                        ].map((stat, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-2xl p-4 lg:p-6 border border-white/5 flex items-center gap-4">
                                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                    <stat.icon size={18} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-lg lg:text-xl font-black tracking-tighter truncate">{stat.value}</div>
                                    <div className="text-[8px] lg:text-[10px] font-black text-[#555] uppercase tracking-widest">{stat.label}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Campaigns Feed */}
                    <div className="glass-card rounded-2xl lg:rounded-[2.5rem] p-4 lg:p-8 border border-white/5">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <h3 className="text-[10px] font-black text-[#555] uppercase tracking-[0.3em]">Tactical Feed</h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[8px] font-black text-[#555] uppercase tracking-widest">Live Sync</span>
                            </div>
                        </div>

                        {loading ? (
                            <BrandedLoader className="py-20" />
                        ) : campaigns.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                                <Activity size={48} className="mx-auto text-[#222] mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#444]">No sequences initiated</p>
                            </div>
                        ) : (
                            <div className="grid lg:grid-cols-2 gap-6">
                                {campaigns.map((campaign) => (
                                    <motion.div key={campaign.id} layout className="rounded-3xl bg-white/[0.02] border border-white/5 p-6 hover:border-[#ff1744]/30 transition-all group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="min-w-0">
                                                <h4 className="text-lg font-black tracking-tighter truncate mb-1">{campaign.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] font-black text-[#555] uppercase tracking-widest">{campaign.campaign_type} • {campaign.trigger_type.replace(/_/g, " ")}</span>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${getStatusColor(campaign.status)}`}>
                                                {campaign.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mb-8">
                                            <div className="text-center p-3 rounded-2xl bg-white/[0.02]">
                                                <div className="text-base font-black">{campaign.sent_count.toLocaleString()}</div>
                                                <div className="text-[8px] font-black uppercase text-[#333]">Sent</div>
                                            </div>
                                            <div className="text-center p-3 rounded-2xl bg-white/[0.02]">
                                                <div className="text-base font-black text-blue-400">{calculateOpenRate(campaign)}%</div>
                                                <div className="text-[8px] font-black uppercase text-[#333]">Open</div>
                                            </div>
                                            <div className="text-center p-3 rounded-2xl bg-white/[0.02]">
                                                <div className="text-base font-black text-green-400">{calculateConversionRate(campaign)}%</div>
                                                <div className="text-[8px] font-black uppercase text-[#333]">Conv</div>
                                            </div>
                                        </div>

                                        <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-6">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${calculateOpenRate(campaign)}%` }}
                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ff1744] to-[#fb8c00]"
                                            />
                                        </div>

                                        <button className="w-full py-4 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 group-hover:bg-[#ff1744] group-hover:text-white group-hover:border-transparent">
                                            Analytics Report <ChevronRight size={14} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Launch Modal - Bottom Sheet */}
            <AnimatePresence>
                {showCreateForm && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-md" onClick={() => setShowCreateForm(false)}>
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-2xl bg-[#0d0d0d] rounded-t-[3rem] sm:rounded-[3rem] p-8 lg:p-12 relative overflow-hidden max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tighter">Sequence Launch</h2>
                                    <p className="text-[10px] font-black text-[#555] uppercase tracking-widest mt-1">Configure Marketing Vector</p>
                                </div>
                                <button onClick={() => setShowCreateForm(false)} className="p-3 bg-white/5 border border-white/5 rounded-2xl"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleCreateCampaign} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Sequence Name</label>
                                    <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] font-bold" placeholder="e.g. Premium Retention Blast" value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Channel</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] font-black uppercase text-[10px] tracking-widest appearance-none" value={newCampaign.campaign_type} onChange={e => setNewCampaign({ ...newCampaign, campaign_type: e.target.value })}>
                                            <option value="email">Email Broadcast</option>
                                            <option value="sms">Direct SMS</option>
                                            <option value="whatsapp">WhatsApp Sync</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Trigger</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] font-black uppercase text-[10px] tracking-widest appearance-none" value={newCampaign.trigger_type} onChange={e => setNewCampaign({ ...newCampaign, trigger_type: e.target.value })}>
                                            <option value="manual">Manual Force</option>
                                            <option value="scheduled">Timed Event</option>
                                            <option value="signup">Cohort Enrollment</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Subject Vector</label>
                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] font-bold" placeholder="High-Impact Hook line" value={newCampaign.subject} onChange={e => setNewCampaign({ ...newCampaign, subject: e.target.value })} />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Copy Context</label>
                                    <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] h-32 font-medium" placeholder="Define the growth message..." value={newCampaign.content} onChange={e => setNewCampaign({ ...newCampaign, content: e.target.value })} />
                                </div>

                                <div className="pt-8 flex gap-4">
                                    <button type="button" onClick={() => setShowCreateForm(false)} className="flex-1 py-5 rounded-2xl bg-white/5 text-[#444] font-black uppercase text-[10px] tracking-widest">Abort</button>
                                    <button type="submit" className="flex-[2] py-5 rounded-2xl btn-premium text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#ff1744]/20 transition-all hover:scale-[1.02]">
                                        Initialize sequence
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
