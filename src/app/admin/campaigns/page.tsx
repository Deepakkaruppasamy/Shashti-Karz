"use client";

import { useState, useEffect } from "react";
import { Send, Users, Calendar, TrendingUp, Eye, Plus, Sparkles, Brain, Zap, Target, MessageCircle, BarChart3, X } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
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



            if (!response.ok) {
                throw new Error("Failed to fetch campaigns");
            }

            const data = await response.json();
            setCampaigns(data.campaigns || []);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
            toast.error("Failed to load campaigns");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
            scheduled: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
            active: "bg-green-500/20 text-green-400 border border-green-500/30",
            paused: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
            completed: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
        };
        return colors[status] || "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    };

    const calculateOpenRate = (campaign: Campaign) => {
        if (campaign.sent_count === 0) return 0;
        return Math.round((campaign.opened_count / campaign.sent_count) * 100);
    };

    const calculateClickRate = (campaign: Campaign) => {
        if (campaign.opened_count === 0) return 0;
        return Math.round((campaign.clicked_count / campaign.opened_count) * 100);
    };

    const calculateConversionRate = (campaign: Campaign) => {
        if (campaign.sent_count === 0) return 0;
        return Math.round((campaign.converted_count / campaign.sent_count) * 100);
    };

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
            } else {
                toast.error("Failed to launch campaign");
            }
        } catch (e) {
            toast.error("Error creating campaign");
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#0a0a0a]">
                <AdminSidebar />
                <div className="flex-1 p-8 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[#ff1744] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[#888] font-mono text-sm">Loading marketing data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white">
            <AdminSidebar />
            <div className="flex-1 p-4 lg:p-8 overflow-auto">
                {/* Header Step 1: Branding Upgrade */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
                            <Target className="text-[#ff1744]" />
                            Growth Engine
                        </h1>
                        <p className="text-[#888] mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            Active Campaign Monitors
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="btn-premium px-8 py-4 rounded-xl flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all hover:scale-105"
                    >
                        <Plus size={18} />
                        Launch Campaign
                    </button>
                </div>

                {/* AI Strategist Section */}
                <div className="glass-card rounded-[2rem] p-8 border border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/5 to-transparent relative overflow-hidden mb-8 group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-[80px]" />
                    <div className="flex items-start justify-between gap-8 relative z-10">
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
                                        <span className="text-xs uppercase tracking-widest">Analyzing customer segments...</span>
                                    </div>
                                ) : aiInsight ? (
                                    <div className="prose prose-invert max-w-none">
                                        {aiInsight}
                                    </div>
                                ) : (
                                    "Ready to analyze campaign performance and suggest optimization strategies."
                                )}
                            </div>
                        </div>
                        <button
                            onClick={generateAiStrategy}
                            className="hidden md:flex flex-col items-center justify-center w-32 h-32 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group/btn"
                        >
                            <Zap size={32} className="text-[#d4af37] mb-2 group-hover/btn:scale-110 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#888] group-hover/btn:text-white">Generate<br />Insight</span>
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: "Total Campaigns", value: campaigns.length, icon: Send, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { label: "Total Reach", value: campaigns.reduce((sum, c) => sum + c.sent_count, 0).toLocaleString(), icon: Users, color: "text-green-500", bg: "bg-green-500/10" },
                        { label: "Avg Open Rate", value: `${Math.round(campaigns.reduce((sum, c) => sum + calculateOpenRate(c), 0) / (campaigns.length || 1))}%`, icon: Eye, color: "text-purple-500", bg: "bg-purple-500/10" },
                        { label: "Conversions", value: campaigns.reduce((sum, c) => sum + c.converted_count, 0), icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10" },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group"
                        >
                            <div className="relative flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <div className="text-3xl font-black tracking-tighter">{stat.value}</div>
                                    <div className="text-[10px] font-black text-[#555] uppercase tracking-widest">{stat.label}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Campaigns List */}
                <div className="glass-card rounded-[2rem] overflow-hidden border border-white/5">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h3 className="font-bold text-lg">Active Campaigns</h3>
                        <div className="flex gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-[#666] uppercase tracking-widest font-bold">Live Data</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-black/20">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Campaign</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Type</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Recipients</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Performance</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {campaigns.map((campaign) => (
                                    <tr key={campaign.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div>
                                                <p className="font-bold text-base mb-1">{campaign.name}</p>
                                                <p className="text-[10px] text-[#666] font-black uppercase tracking-widest">
                                                    {campaign.trigger_type.replace(/_/g, " ")}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                {campaign.campaign_type === 'email' ? <MessageCircle size={14} className="text-blue-500" /> : <Send size={14} className="text-green-500" />}
                                                <span className="text-xs font-medium capitalize">{campaign.campaign_type}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(
                                                    campaign.status
                                                )}`}
                                            >
                                                {campaign.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold">{campaign.sent_count.toLocaleString()}</div>
                                        </td>
                                        <td className="px-8 py-6 w-64">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-bold text-[#666] uppercase tracking-widest">
                                                    <span>Open Rate</span>
                                                    <span>{calculateOpenRate(campaign)}%</span>
                                                </div>
                                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                                        style={{ width: `${calculateOpenRate(campaign)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs text-[#666] font-mono">
                                                {new Date(campaign.created_at).toLocaleDateString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {campaigns.length === 0 && (
                            <div className="text-center py-20 text-[#666]">
                                <Send size={48} className="mx-auto mb-6 opacity-20" />
                                <p className="text-lg font-bold">No campaigns initiated</p>
                                <p className="text-sm">Launch your first marketing sequence</p>
                            </div>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {showCreateForm && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setShowCreateForm(false)}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 max-w-2xl w-full relative overflow-hidden"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff1744]/10 rounded-full blur-[100px] -z-1" />

                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tighter">Launch Campaign</h2>
                                        <p className="text-[10px] font-black text-[#666] uppercase tracking-[0.2em] mt-1">New Marketing Sequence</p>
                                    </div>
                                    <button onClick={() => setShowCreateForm(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-colors border border-white/5"><X size={24} /></button>
                                </div>

                                <form onSubmit={handleCreateCampaign} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#666] uppercase tracking-[0.2em] ml-1">Campaign Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:border-[#ff1744] focus:outline-none font-bold"
                                            placeholder="e.g. Summer Sale Blast"
                                            value={newCampaign.name}
                                            onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#666] uppercase tracking-[0.2em] ml-1">Channel</label>
                                            <select
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-[#ff1744] focus:outline-none font-bold"
                                                value={newCampaign.campaign_type}
                                                onChange={e => setNewCampaign({ ...newCampaign, campaign_type: e.target.value })}
                                            >
                                                <option value="email">Email</option>
                                                <option value="sms">SMS</option>
                                                <option value="push">Push Notification</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#666] uppercase tracking-[0.2em] ml-1">Trigger</label>
                                            <select
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-[#ff1744] focus:outline-none font-bold"
                                                value={newCampaign.trigger_type}
                                                onChange={e => setNewCampaign({ ...newCampaign, trigger_type: e.target.value })}
                                            >
                                                <option value="manual">Manual Launch</option>
                                                <option value="scheduled">Scheduled</option>
                                                <option value="signup">On User Signup</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#666] uppercase tracking-[0.2em] ml-1">Subject / Header</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:border-[#ff1744] focus:outline-none font-bold"
                                            placeholder="Campaign Subject Line"
                                            value={newCampaign.subject}
                                            onChange={e => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#666] uppercase tracking-[0.2em] ml-1">Content</label>
                                        <textarea
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:border-[#ff1744] focus:outline-none font-medium h-32 resize-none"
                                            placeholder="Campaign messaging body..."
                                            value={newCampaign.content}
                                            onChange={e => setNewCampaign({ ...newCampaign, content: e.target.value })}
                                        />
                                    </div>

                                    <div className="pt-4 flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateForm(false)}
                                            className="flex-1 px-8 py-4 rounded-2xl bg-white/5 border border-white/5 text-[#888] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white/10 hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white font-black uppercase text-[10px] tracking-[0.2em] hover:scale-[1.02] transition-transform shadow-lg shadow-[#ff1744]/20"
                                        >
                                            Launch Sequence
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
