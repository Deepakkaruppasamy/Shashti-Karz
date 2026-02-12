"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SupportRequest, CustomerFeedbackDinesh } from "@/lib/types";
import {
    MessageSquare,
    Mail,
    Phone,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Send,
    TrendingUp,
    Users,
    MessageCircleMore,
    ChevronRight,
    X,
    MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandedLoader } from "@/components/animations/BrandedLoader";
import { toast } from "sonner";

export default function DineshSupportPage() {
    const [activeTab, setActiveTab] = useState<"support" | "feedback">("support");
    const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
    const [feedbackList, setFeedbackList] = useState<CustomerFeedbackDinesh[]>([]);
    const [selectedSupport, setSelectedSupport] = useState<SupportRequest | null>(null);
    const [selectedFeedback, setSelectedFeedback] = useState<CustomerFeedbackDinesh | null>(null);
    const [responseText, setResponseText] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [activeTab, filterStatus]);

    const loadData = async () => {
        setLoading(true);
        const supabase = createClient();

        if (activeTab === "support") {
            let query = supabase
                .from("support_requests")
                .select("*")
                .order("created_at", { ascending: false });

            if (filterStatus !== "all") query = query.eq("status", filterStatus);

            const { data, error } = await query;
            if (!error && data) setSupportRequests(data as SupportRequest[]);
        } else {
            let query = supabase
                .from("customer_feedback_dinesh")
                .select("*")
                .order("created_at", { ascending: false });

            if (filterStatus !== "all") query = query.eq("status", filterStatus);

            const { data, error } = await query;
            if (!error && data) setFeedbackList(data as CustomerFeedbackDinesh[]);
        }
        setLoading(false);
    };

    const handleSupportResponse = async () => {
        if (!selectedSupport || !responseText.trim()) return;

        const supabase = createClient();
        const { error } = await supabase
            .from("support_requests")
            .update({
                admin_response: responseText,
                status: "resolved",
                conversation_history: [
                    ...(selectedSupport.conversation_history || []),
                    {
                        sender: "admin" as const,
                        message: responseText,
                        timestamp: new Date().toISOString(),
                    },
                ],
            })
            .eq("id", selectedSupport.id);

        if (!error) {
            toast.success("Response dispatched");
            setResponseText("");
            setSelectedSupport(null);
            loadData();
        }
    };

    const handleFeedbackReview = async (status: string) => {
        if (!selectedFeedback) return;

        const supabase = createClient();
        const { error } = await supabase
            .from("customer_feedback_dinesh")
            .update({
                status,
                admin_notes: adminNotes,
                reviewed_at: new Date().toISOString(),
            })
            .eq("id", selectedFeedback.id);

        if (!error) {
            toast.success(`Feedback status: ${status}`);
            setAdminNotes("");
            setSelectedFeedback(null);
            loadData();
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "pending":
            case "new": return <Clock className="text-yellow-500" size={16} />;
            case "resolved":
            case "implemented": return <CheckCircle className="text-green-500" size={16} />;
            default: return <AlertCircle className="text-[#333]" size={16} />;
        }
    };

    const filteredSupport = supportRequests.filter(req =>
        req.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredFeedback = feedbackList.filter(fb =>
        fb.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white">
            <div className="flex-1 overflow-auto pb-24 lg:pb-8">
                <div className="p-4 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-black tracking-tighter flex items-center gap-3">
                                <MessageCircleMore className="text-purple-500" />
                                Support Lexicon
                            </h1>
                            <p className="text-[#888] mt-1 flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                Dinesh Voice Assistant Inquiries
                            </p>
                        </div>
                        <div className="flex p-1 glass-card rounded-2xl border border-white/5 bg-white/5">
                            {(["support", "feedback"] as const).map((t) => (
                                <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? "bg-white text-[#0a0a0a] shadow-lg" : "text-[#555] hover:text-white"}`}>
                                    {t === 'support' ? "Tickets" : "Insights"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: "Total Requests", value: supportRequests.length, icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
                            { label: "Pending Fixes", value: supportRequests.filter(s => s.status === "pending").length, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
                            { label: "User Feedback", value: feedbackList.length, icon: MessageCircleMore, color: "text-blue-500", bg: "bg-blue-500/10" },
                            { label: "New Sentiment", value: feedbackList.filter(f => f.status === "new").length, icon: Users, color: "text-green-500", bg: "bg-green-500/10" },
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

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#333] group-focus-within:text-purple-500 transition-colors" size={16} />
                            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-purple-500 font-bold" placeholder="Reference Search..." />
                        </div>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-purple-500 font-black uppercase text-[10px] tracking-widest appearance-none min-w-[160px]">
                            <option value="all">Global Priority</option>
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                            <option value="new">New Sentiment</option>
                        </select>
                    </div>

                    {/* Feed */}
                    <div className="grid lg:grid-cols-2 gap-8 items-start">
                        <div className="glass-card rounded-[2.5rem] p-4 lg:p-8 border border-white/5">
                            <h3 className="text-[10px] font-black text-[#333] uppercase tracking-[0.3em] mb-8 px-2">Deployment Feed</h3>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {loading ? (
                                    <BrandedLoader className="py-20" />
                                ) : activeTab === "support" ? (
                                    filteredSupport.map((req) => (
                                        <motion.div key={req.id} layout onClick={() => setSelectedSupport(req)} className={`p-6 rounded-3xl border transition-all cursor-pointer ${selectedSupport?.id === req.id ? "bg-purple-500/10 border-purple-500/50" : "bg-white/[0.02] border-white/5 hover:border-white/20"}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    {getStatusIcon(req.status)}
                                                    <span className="text-sm font-black tracking-tighter">{req.customer_name}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${req.priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-white/5 text-[#444]'}`}>{req.priority}</span>
                                            </div>
                                            <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2 line-clamp-1">{req.subject}</h4>
                                            <p className="text-xs text-[#666] line-clamp-2 leading-relaxed">{req.message}</p>
                                        </motion.div>
                                    ))
                                ) : (
                                    filteredFeedback.map((fb) => (
                                        <motion.div key={fb.id} layout onClick={() => setSelectedFeedback(fb)} className={`p-6 rounded-3xl border transition-all cursor-pointer ${selectedFeedback?.id === fb.id ? "bg-blue-500/10 border-blue-500/50" : "bg-white/[0.02] border-white/5 hover:border-white/20"}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    {getStatusIcon(fb.status)}
                                                    <span className="text-sm font-black tracking-tighter">{fb.customer_name}</span>
                                                </div>
                                                {fb.rating && <span className="text-yellow-500 text-[10px]">{"★".repeat(fb.rating)}</span>}
                                            </div>
                                            <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[8px] font-black uppercase tracking-widest mb-3">{fb.feedback_type}</span>
                                            <p className="text-xs text-[#666] line-clamp-2 leading-relaxed">{fb.message}</p>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Inspector */}
                        <div className="glass-card rounded-[2.5rem] p-6 lg:p-10 border border-white/5 relative min-h-[400px]">
                            <AnimatePresence mode="wait">
                                {selectedSupport ? (
                                    <motion.div key="support-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                        <div className="flex justify-between items-start">
                                            <h2 className="text-2xl font-black tracking-tighter">Vector Analysis</h2>
                                            <button onClick={() => setSelectedSupport(null)} className="p-2 bg-white/5 rounded-xl"><X size={18} /></button>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-6 bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                                                <div>
                                                    <label className="text-[8px] font-black text-[#555] uppercase tracking-widest block mb-1">Subject</label>
                                                    <p className="text-xs font-bold text-purple-400">{selectedSupport.subject}</p>
                                                </div>
                                                <div>
                                                    <label className="text-[8px] font-black text-[#555] uppercase tracking-widest block mb-1">Status</label>
                                                    <p className="text-xs font-bold uppercase">{selectedSupport.status}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[8px] font-black text-[#555] uppercase tracking-widest block">Payload context</label>
                                                <div className="p-6 rounded-3xl bg-black/40 border border-white/5 text-xs leading-relaxed text-[#888]">{selectedSupport.message}</div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-widest ml-1">Admin Response</label>
                                                <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-purple-500 h-32 resize-none" placeholder="Draft resolution message..." />
                                                <button onClick={handleSupportResponse} className="w-full btn-premium py-5 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3">
                                                    <Send size={18} /> Deploy Resolution
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : selectedFeedback ? (
                                    <motion.div key="feedback-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                        <div className="flex justify-between items-start">
                                            <h2 className="text-2xl font-black tracking-tighter">Sentiment Intake</h2>
                                            <button onClick={() => setSelectedFeedback(null)} className="p-2 bg-white/5 rounded-xl"><X size={18} /></button>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex gap-4 items-center">
                                                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 font-black">{selectedFeedback.satisfaction_score}/10</div>
                                                <div>
                                                    <p className="text-sm font-black tracking-tighter">{selectedFeedback.customer_name}</p>
                                                    <p className="text-[8px] font-black text-[#555] uppercase tracking-widest">{selectedFeedback.feedback_type}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[8px] font-black text-[#555] uppercase tracking-widest block">Log Content</label>
                                                <div className="p-6 rounded-3xl bg-black/40 border border-white/5 text-xs leading-relaxed text-[#888]">{selectedFeedback.message}</div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-widest ml-1">Internal Notes</label>
                                                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-blue-500 h-24 resize-none" placeholder="Classify sentiment..." />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <button onClick={() => handleFeedbackReview("reviewed")} className="py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 hover:text-blue-400 transition-all">Review</button>
                                                    <button onClick={() => handleFeedbackReview("implemented")} className="py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500/20 hover:text-green-400 transition-all">Implement</button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-[#222] gap-4">
                                        <MessageCircle size={48} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Select Vector Feed</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
