"use client";

import { useState, useEffect } from "react";
import {
    Plus, Search, Filter, MoreHorizontal, FileVideo,
    Image as ImageIcon, Trash2, Edit, CheckCircle, XCircle,
    Upload, Eye, MousePointer, Calendar, Loader2, X, ChevronRight, Activity, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Ad } from "@/lib/types";


export default function AdsAdminPage() {
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Ad>>({
        title: "",
        description: "",
        media_type: "video",
        position: "home_hero",
        status: "draft",
        priority: 0
    });
    const [mediaFile, setMediaFile] = useState<File | null>(null);

    useEffect(() => {
        fetchAds();
    }, []);

    const fetchAds = async () => {
        try {
            const res = await fetch("/api/admin/ads");
            const data = await res.json();
            if (data.success) setAds(data.ads);
        } catch (error) {
            toast.error("Failed to load campaigns");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File): Promise<string | null> => {
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");
            return data.url;
        } catch (error) {
            toast.error("Media deployment failed");
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let mediaUrl = formData.media_url;
        if (mediaFile) {
            const url = await handleFileUpload(mediaFile);
            if (!url) return;
            mediaUrl = url;
        }

        try {
            const res = await fetch("/api/admin/ads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, media_url: mediaUrl })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("Campaign deployed successfully");
            setIsCreating(false);
            resetForm();
            fetchAds();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const resetForm = () => {
        setFormData({ title: "", description: "", media_type: "video", position: "home_hero", status: "draft" });
        setMediaFile(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Terminate this campaign?")) return;
        try {
            const res = await fetch(`/api/admin/ads?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Campaign terminated");
                fetchAds();
            }
        } catch (e) { toast.error("Termination failed"); }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return "text-green-500 bg-green-500/10 border-green-500/20";
            case 'scheduled': return "text-blue-500 bg-blue-500/10 border-blue-500/20";
            default: return "text-slate-500 bg-white/5 border-white/5";
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
                                <Zap className="text-[#ff1744]" />
                                Visual Nexus
                            </h1>
                            <p className="text-[#888] mt-1 flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                Interactive Ad Engine
                            </p>
                        </div>
                        <button
                            onClick={() => { resetForm(); setIsCreating(true); }}
                            className="w-full md:w-auto btn-premium px-8 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#ff1744]/20 transition-all hover:scale-[1.02]"
                        >
                            <Plus size={18} />
                            Deploy Campaign
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: "Total Reach", value: ads.reduce((s, a) => s + (a.impressions || 0), 0).toLocaleString(), icon: Eye, color: "text-blue-400", bg: "bg-blue-400/10" },
                            { label: "Engagements", value: ads.reduce((s, a) => s + (a.clicks || 0), 0).toLocaleString(), icon: MousePointer, color: "text-[#ff1744]", bg: "bg-[#ff1744]/10" },
                            { label: "Active Channels", value: ads.filter(a => a.status === 'active').length, icon: Activity, color: "text-green-400", bg: "bg-green-400/10" },
                            { label: "Storage Load", value: "48.2MB", icon: Upload, color: "text-purple-400", bg: "bg-purple-400/10" },
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

                    {/* Main Content */}
                    <div className="glass-card rounded-2xl lg:rounded-[2.5rem] p-4 lg:p-8 border border-white/5">
                        {loading ? (
                            <div className="text-center py-24">
                                <div className="w-12 h-12 border-4 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#222]">Initializing Matrix...</p>
                            </div>
                        ) : ads.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                                <FileVideo size={48} className="mx-auto text-[#222] mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#444]">No active campaigns</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                                {ads.map((ad) => (
                                    <motion.div key={ad.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[2.5rem] bg-white/[0.02] border border-white/5 overflow-hidden group hover:border-[#ff1744]/30 transition-all flex flex-col">
                                        <div className="aspect-video bg-black relative overflow-hidden">
                                            {ad.media_type === 'video' ? (
                                                <video src={ad.media_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <img src={ad.media_url || ''} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                            )}
                                            <div className="absolute top-4 left-4">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(ad.status)}`}>
                                                    {ad.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-6 lg:p-8 flex-1 flex flex-col">
                                            <div className="mb-4">
                                                <h3 className="text-xl font-black tracking-tighter mb-1 line-clamp-1">{ad.title}</h3>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#ff1744]">{ad.position.replace('_', ' ')}</p>
                                            </div>

                                            <p className="text-xs text-[#666] mb-8 line-clamp-2 leading-relaxed font-medium">
                                                {ad.description || "No tactical details provided for this campaign node."}
                                            </p>

                                            <div className="mt-auto grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                                                <div className="text-center">
                                                    <div className="text-sm font-black">{ad.impressions.toLocaleString()}</div>
                                                    <div className="text-[8px] font-black uppercase text-[#333]">Impressions</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-sm font-black">{ad.clicks.toLocaleString()}</div>
                                                    <div className="text-[8px] font-black uppercase text-[#333]">Engaged</div>
                                                </div>
                                            </div>

                                            <div className="pt-6 flex gap-2">
                                                <button className="flex-1 py-3 bg-white/5 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                                                    <Edit size={14} /> Analytics
                                                </button>
                                                <button onClick={() => handleDelete(ad.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/10 hover:bg-red-500/20 transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Creation Modal - Mobile Responsive Bottom Sheet */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-md" onClick={() => setIsCreating(false)}>
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-2xl bg-[#0d0d0d] rounded-t-[3rem] sm:rounded-[3rem] p-8 lg:p-12 relative overflow-hidden max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tighter">New Campaign Feed</h2>
                                    <p className="text-[10px] font-black text-[#555] uppercase tracking-widest mt-1">Configure Visual Deployment</p>
                                </div>
                                <button onClick={() => setIsCreating(false)} className="p-3 bg-white/5 border border-white/5 rounded-2xl"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Strategy Title</label>
                                        <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] font-bold" placeholder="e.g. Summer Blitz Video" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Tactical Position</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] font-black uppercase text-[10px] tracking-widest appearance-none" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })}>
                                            <option value="home_hero">Hero (Full Width)</option>
                                            <option value="sidebar">Auxiliary Channel</option>
                                            <option value="popup">Direct Response</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Copy Context</label>
                                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] h-24 font-medium text-sm" placeholder="Define the value prop..." />
                                </div>

                                {/* Media Uploader */}
                                <div className={`relative border-2 border-dashed rounded-[2rem] p-10 lg:p-14 text-center transition-all ${mediaFile ? "border-green-500 bg-green-500/5" : "border-white/10 bg-white/[0.02] hover:border-[#ff1744]/30"}`}>
                                    <input type="file" accept="video/*,image/*" onChange={e => e.target.files && setMediaFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    <div className="flex flex-col items-center gap-4">
                                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl ${mediaFile ? "bg-green-500" : "bg-white/5"}`}>
                                            {mediaFile ? <CheckCircle className="text-white" size={32} /> : <Upload className="text-[#ff1744]" size={32} />}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xl font-black tracking-tight">{mediaFile ? mediaFile.name : "Select Tactical Asset"}</p>
                                            <p className="text-[10px] font-black uppercase text-[#444] tracking-widest">MP4 / WebM / JPG up to 50MB</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Redirect Vector</label>
                                        <input value={formData.target_url || ''} onChange={e => setFormData({ ...formData, target_url: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] font-bold" placeholder="https://..." />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Sync Status</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] font-black uppercase text-[10px] tracking-widest appearance-none" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                                            <option value="draft">Inactive Log</option>
                                            <option value="active">Live Broadcast</option>
                                            <option value="scheduled">Reserved Feed</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-8 flex gap-4">
                                    <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-5 rounded-2xl bg-white/5 text-[#444] font-black uppercase text-[10px] tracking-widest">Abort</button>
                                    <button type="submit" disabled={uploading} className="flex-[2] py-5 rounded-2xl btn-premium text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#ff1744]/20 disabled:opacity-50">
                                        {uploading ? <Loader2 className="animate-spin" /> : "Initiate Deployment"}
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
