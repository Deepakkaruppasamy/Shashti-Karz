"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Send, Users, Clock, CheckCheck, Plus, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [stats, setStats] = useState<WhatsAppStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [aiTemplatePrompt, setAiTemplatePrompt] = useState("");
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [generatedTemplate, setGeneratedTemplate] = useState("");

    const router = useRouter();

    useEffect(() => {
        fetchWhatsAppData();
    }, []);

    const fetchWhatsAppData = async () => {
        try {
            // Placeholder data - replace with actual API call
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
            console.error("Error fetching WhatsApp data:", error);
            toast.error("Failed to load WhatsApp data");
        } finally {
            setLoading(false);
        }
    };

    const generateAiTemplate = async () => {
        if (!aiTemplatePrompt) {
            toast.error("Please enter a prompt for the AI");
            return;
        }
        setIsAiGenerating(true);
        try {
            const res = await fetch("/api/ai/admin-command", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    command: `Create a WhatsApp message template for: ${aiTemplatePrompt}. Format it with {{1}}, {{2}} placeholders for variables.`,
                    context: {
                        type: "whatsapp_template_generation",
                        constraints: "Limit 250 characters, use emojis, professional tone."
                    }
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setGeneratedTemplate(data.response);
                toast.success("Template Generated!");
            }
        } catch (e) {
            toast.error("Failed to generate template");
        } finally {
            setIsAiGenerating(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            approved: "bg-green-500/20 text-green-400 border border-green-500/30",
            pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
            rejected: "bg-red-500/20 text-red-400 border border-red-500/30",
        };
        return colors[status] || "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#0a0a0a]">
                <AdminSidebar />
                <div className="flex-1 p-8 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[#25D366] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[#888] font-mono text-sm">Validating connection...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0a0a0a]">
            <AdminSidebar />
            <div className="flex-1 p-4 lg:p-8 space-y-8 overflow-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 text-white">
                            <MessageCircle className="text-[#25D366]" />
                            WhatsApp Connect
                        </h1>
                        <p className="text-[#888] mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                            Meta Business API Status: Active
                        </p>
                    </div>
                    <button className="px-6 py-4 bg-[#25D366] text-white rounded-2xl font-bold shadow-lg shadow-[#25D366]/20 hover:opacity-90 transition-all flex items-center gap-2 hover:scale-105 active:scale-95">
                        <Send size={20} />
                        New Broadcast
                    </button>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#25D366]/5 rounded-full blur-[40px]" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-14 h-14 bg-[#25D366]/10 rounded-2xl flex items-center justify-center">
                                    <Send className="text-[#25D366]" size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-[#888] font-bold">Messages Sent</p>
                                    <p className="text-3xl font-black text-white mt-1">
                                        {stats.total_sent.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center">
                                    <CheckCheck className="text-green-500" size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-[#888] font-bold">Delivery Rate</p>
                                    <p className="text-3xl font-black text-white mt-1">{stats.delivery_rate}%</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                    <Clock className="text-blue-500" size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-[#888] font-bold">Read Rate</p>
                                    <p className="text-3xl font-black text-white mt-1">{stats.read_rate}%</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                                    <MessageCircle className="text-orange-500" size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-[#888] font-bold">Reply Rate</p>
                                    <p className="text-3xl font-black text-white mt-1">{stats.reply_rate}%</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* AI Template Creator */}
                <div className="glass-card rounded-[2rem] p-8 border border-white/5 bg-gradient-to-br from-[#1a1a1a] to-transparent relative overflow-hidden mb-8">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 flex items-center justify-center">
                                    <Sparkles className="text-[#25D366]" size={20} />
                                </div>
                                <h2 className="text-xl font-bold">AI Template Architect</h2>
                            </div>
                            <p className="text-[#888] mb-6 text-sm">Describe the message you want to send, and Shashti AI will format it for WhatsApp approval.</p>

                            <div className="space-y-4">
                                <textarea
                                    value={aiTemplatePrompt}
                                    onChange={(e) => setAiTemplatePrompt(e.target.value)}
                                    placeholder="e.g. A booking confirmation for a premium detailing service with time and location..."
                                    rows={3}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#25D366]"
                                />
                                <button
                                    onClick={generateAiTemplate}
                                    disabled={isAiGenerating}
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    {isAiGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} className="text-[#25D366]" />}
                                    Generate Template
                                </button>
                            </div>
                        </div>

                        <div className="bg-black/40 rounded-2xl p-6 border border-white/5 h-full relative">
                            <div className="absolute top-4 right-4 text-xs font-mono text-[#666]">PREVIEW</div>
                            {generatedTemplate ? (
                                <div className="prose prose-invert">
                                    <p className="whitespace-pre-wrap font-medium text-[#ccc]">{generatedTemplate}</p>
                                    <div className="mt-4 flex gap-2">
                                        <button className="px-3 py-1.5 bg-[#25D366] text-black text-xs font-bold rounded-lg hover:opacity-90">Use Template</button>
                                        <button onClick={() => setGeneratedTemplate("")} className="px-3 py-1.5 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20">Clear</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-[#444] min-h-[150px]">
                                    <MessageCircle size={32} className="mb-2 opacity-50" />
                                    <p className="text-sm">Generated content will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Templates Section */}
                <div className="glass-card rounded-[2rem] p-8 border border-white/5">
                    <h2 className="text-xl font-bold text-white mb-4">Approved Templates</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            {
                                name: "booking_confirmation",
                                category: "TRANSACTIONAL",
                                status: "approved",
                                content: "Your booking is confirmed! Date: {{date}}, Time: {{time}}, Service: {{service}}",
                            },
                            {
                                name: "worker_assigned",
                                category: "TRANSACTIONAL",
                                status: "pending",
                                content: "Worker {{worker_name}} has been assigned to your booking! ETA: {{eta}}",
                            },
                            {
                                name: "service_completed",
                                category: "TRANSACTIONAL",
                                status: "approved",
                                content: "Service completed! Please rate us: {{rating_link}}",
                            },
                            {
                                name: "marketing_offer_new",
                                category: "MARKETING",
                                status: "rejected",
                                content: "Hey! 20% off this weekend. Use code OFFER20.",
                            },
                        ].map((template) => (
                            <div key={template.name} className="border border-white/10 rounded-2xl p-6 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="font-bold text-white text-base mb-1">{template.name}</p>
                                        <p className="text-[10px] uppercase tracking-widest text-[#666]">{template.category}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusColor(template.status)}`}>
                                        {template.status}
                                    </span>
                                </div>
                                <p className="text-sm text-[#aaa] bg-black/20 p-4 rounded-xl border border-white/5 font-mono leading-relaxed">
                                    {template.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
