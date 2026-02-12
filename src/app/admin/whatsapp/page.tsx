"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Send, Users, Clock, CheckCheck, Plus, Sparkles, AlertCircle, RefreshCw, X, ChevronRight, Activity } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSound } from "@/hooks/useSound";
import { motion, AnimatePresence } from "framer-motion";
import { BrandedLoader } from "@/components/animations/BrandedLoader";

interface WhatsAppTemplate {
    id: string;
    name: string;
    category: string;
    language: string;
    status: string;
    content: string;
    variables_count: number;
}

interface WhatsAppStats {
    total_sent: number;
    total_delivered: number;
    total_read: number;
    total_replied: number;
    delivery_rate: number;
    read_rate: number;
    reply_rate: number;
}

export default function WhatsAppAdminPage() {
    const [stats, setStats] = useState<WhatsAppStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [aiTemplatePrompt, setAiTemplatePrompt] = useState("");
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [generatedTemplate, setGeneratedTemplate] = useState("");
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("templates");


    useEffect(() => {
        fetchWhatsAppData();
        // Simulate loading settings
        setTimeout(() => setIsLoading(false), 500);
    }, []);

    const fetchWhatsAppData = async () => {
        try {
            setStats({
                total_sent: 1523,
                total_delivered: 1498,
                total_read: 1342,
                total_replied: 456,
                delivery_rate: 98.4,
                read_rate: 89.6,
                reply_rate: 30.2,
            });
        } catch (error) {
            toast.error("Failed to load WhatsApp data");
        } finally {
            setIsLoading(false);
        }
    };

    const generateAiTemplate = async () => {
        if (!aiTemplatePrompt) return toast.error("Enter a prompt");
        setIsAiGenerating(true);
        try {
            const res = await fetch("/api/ai/admin-command", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    command: `Create a WhatsApp message template for: ${aiTemplatePrompt}. Format it with {{1}}, {{2}} placeholders for variables.`,
                    context: { type: "whatsapp_template_generation", constraints: "Limit 250 characters, use emojis, professional tone." }
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setGeneratedTemplate(data.response);
                toast.success("Template Generated!");
            }
        } finally {
            setIsAiGenerating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return "text-green-500 bg-green-500/10 border-green-500/20";
            case 'pending': return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
            case 'rejected': return "text-red-500 bg-red-500/10 border-red-500/20";
            default: return "text-slate-500 bg-white/5 border-white/10";
        }
    };

    if (isLoading) return <BrandedLoader fullPage />;

    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white">
            <div className="flex-1 overflow-auto pb-24 lg:pb-8">
                <div className="p-4 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-black tracking-tighter flex items-center gap-3">
                                <MessageCircle className="text-[#25D366]" />
                                WhatsApp Connect
                            </h1>
                            <p className="text-[#888] mt-1 flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                                Meta Business API: Active
                            </p>
                        </div>
                        <button
                            onClick={() => setShowBroadcastModal(true)}
                            className="w-full md:w-auto px-8 py-4 bg-[#25D366] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#25D366]/20 transition-all hover:scale-[1.02]"
                        >
                            <Send size={18} />
                            New Broadcast
                        </button>
                    </div>

                    {/* Stats */}
                    {historyLoading ? (
                        <BrandedLoader className="py-20" />
                    ) : broadcastHistory.length === 0 && !historyLoading && (
                        stats && (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {[
                                    { label: "Sent", value: stats.total_sent.toLocaleString(), icon: Send, color: "text-[#25D366]", bg: "bg-[#25D366]/10" },
                                    { label: "Delivered", value: `${stats.delivery_rate}%`, icon: CheckCheck, color: "text-green-500", bg: "bg-green-500/10" },
                                    { label: "Read", value: `${stats.read_rate}%`, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
                                    { label: "Replied", value: `${stats.reply_rate}%`, icon: MessageCircle, color: "text-orange-500", bg: "bg-orange-500/10" },
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
                        )
                    )}

                    {/* AI Template Architect */}
                    <div className="glass-card rounded-[2rem] p-6 lg:p-10 border border-[#25D366]/20 bg-[#25D366]/5 relative overflow-hidden mb-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#25D366]/5 rounded-full blur-[80px]" />
                        <div className="flex flex-col md:flex-row items-start justify-between gap-8 relative z-10">
                            <div className="flex-1 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-2xl shadow-lg shadow-[#25D366]/20">
                                        <Sparkles size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black tracking-tighter">AI Template Architect</h3>
                                        <p className="text-[10px] font-black text-[#555] uppercase tracking-widest mt-1">Automated Message Engineering</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <textarea
                                        value={aiTemplatePrompt}
                                        onChange={(e) => setAiTemplatePrompt(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm font-medium focus:border-[#25D366] outline-none h-28 resize-none"
                                        placeholder="Describe the message sequence... e.g. Payment link reminder for pending ceramic coating invoices."
                                    />
                                    <button
                                        onClick={generateAiTemplate}
                                        disabled={isAiGenerating}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                    >
                                        {isAiGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} className="text-[#25D366]" />}
                                        Generate Template
                                    </button>
                                </div>
                            </div>

                            <div className="w-full md:w-80 shrink-0">
                                <div className="bg-[#075E54] rounded-2xl p-6 relative min-h-[160px] flex flex-col shadow-2xl">
                                    <div className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-4">Shashti AI Proxy</div>
                                    {generatedTemplate ? (
                                        <div className="space-y-4">
                                            <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">{generatedTemplate}</p>
                                            <div className="flex gap-2">
                                                <button className="flex-1 py-2 bg-white text-[#075E54] text-[8px] font-black uppercase rounded-lg hover:bg-white/90">Initialize</button>
                                                <button onClick={() => setGeneratedTemplate("")} className="px-3 py-2 bg-black/20 text-white text-[8px] font-black uppercase rounded-lg">Clear</button>
                                            </div>
                                        </div>
                                    ) : (
                                        isLoading ? (
                                            <BrandedLoader className="py-20" />
                                        ) : activeTab === "support" ? (
                                            <div className="flex-1 flex flex-col items-center justify-center text-white/20 gap-2">
                                                <Activity size={32} />
                                                <p className="text-[10px] font-black uppercase">Awaiting Vector</p>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-white/20 gap-2">
                                                <Activity size={32} />
                                                <p className="text-[10px] font-black uppercase">Awaiting Vector</p>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Approved Templates */}
                    <div className="glass-card rounded-2xl lg:rounded-[2.5rem] p-4 lg:p-8 border border-white/5">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <h3 className="text-[10px] font-black text-[#555] uppercase tracking-[0.3em]">Approved Registry</h3>
                            <button className="text-[8px] font-black text-[#25D366] uppercase tracking-widest flex items-center gap-1">
                                View Registry <ChevronRight size={10} />
                            </button>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            {[
                                { name: "booking_confirmation", category: "TRANSACTIONAL", status: "approved", content: "Your booking is confirmed! Date: {{1}}, Time: {{2}}, Service: {{3}}", icon: CheckCheck },
                                { name: "worker_assigned", category: "TRANSACTIONAL", status: "pending", content: "Worker {{1}} has been assigned to your booking! ETA: {{2}}", icon: Clock },
                                { name: "service_completed", category: "TRANSACTIONAL", status: "approved", content: "Service completed! View your digital report: {{1}}", icon: CheckCheck },
                                { name: "premium_offer", category: "MARKETING", status: "rejected", content: "Hey! 20% off this weekend for premium detailing. Use: {{1}}", icon: X },
                            ].map((template) => (
                                <div key={template.name} className="rounded-3xl bg-white/[0.02] border border-white/5 p-6 hover:border-[#25D366]/30 transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-black tracking-tighter truncate mb-1">{template.name}</h4>
                                            <span className="text-[8px] font-black text-[#444] uppercase tracking-widest">{template.category}</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getStatusColor(template.status)}`}>
                                            {template.status}
                                        </span>
                                    </div>
                                    <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                        <p className="text-[10px] text-[#888] font-mono leading-relaxed">{template.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Broadcast Modal - Bottom Sheet */}
            <AnimatePresence>
                {showBroadcastModal && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-md" onClick={() => setShowBroadcastModal(false)}>
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-2xl bg-[#0d0d0d] rounded-t-[3rem] sm:rounded-[3rem] p-8 lg:p-12 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tighter">New Broadcast</h2>
                                    <p className="text-[10px] font-black text-[#555] uppercase tracking-widest mt-1">Initialize Meta API Sequence</p>
                                </div>
                                <button onClick={() => setShowBroadcastModal(false)} className="p-3 bg-white/5 border border-white/5 rounded-2xl"><X size={24} /></button>
                            </div>

                            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); toast.success("Broadcast sequence initialized!"); setShowBroadcastModal(false); }}>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Template Segment</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#25D366] font-black uppercase text-[10px] tracking-widest appearance-none">
                                        <option>Select Approved Template...</option>
                                        <option>booking_confirmation</option>
                                        <option>service_completed</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Cohort Selection</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#25D366] font-black uppercase text-[10px] tracking-widest appearance-none">
                                        <option>All Active Customers (1,247)</option>
                                        <option>Luxury Tier Only (342)</option>
                                        <option>Dormant Nodes (156)</option>
                                    </select>
                                </div>

                                <div className="pt-8 flex gap-4">
                                    <button type="button" onClick={() => setShowBroadcastModal(false)} className="flex-1 py-5 rounded-2xl bg-white/5 text-[#444] font-black uppercase text-[10px] tracking-widest">Abort</button>
                                    <button type="submit" className="flex-[2] py-5 rounded-2xl bg-[#25D366] text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#25D366]/20 transition-all hover:scale-[1.02]">
                                        Execute Campaign
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
