"use client";

import { useState, useEffect } from "react";
import {
    Plus, Search, Filter, MoreHorizontal, FileVideo,
    Image as ImageIcon, Trash2, Edit, CheckCircle, XCircle,
    Upload, Eye, MousePointer, Calendar, Loader2
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

    const supabase = createClient();

    useEffect(() => {
        fetchAds();
    }, []);

    const fetchAds = async () => {
        try {
            const res = await fetch("/api/admin/ads");
            const data = await res.json();
            if (data.success) {
                setAds(data.ads);
            }
        } catch (error) {
            toast.error("Failed to load ads");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File): Promise<string | null> => {
        try {
            setUploading(true);

            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Upload failed");
            }

            return data.url;
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("File upload failed");
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Upload media if present
        let mediaUrl = formData.media_url;
        if (mediaFile) {
            const url = await handleFileUpload(mediaFile);
            if (!url) return;
            mediaUrl = url;
        }

        try {
            const res = await fetch("/api/admin/ads", {
                method: "POST", // Simple POST for creation, we'll skip Edit logic for brevity in this step
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    media_url: mediaUrl
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("Ad campaign created successfully");
            setIsCreating(false);
            setFormData({ title: "", description: "", media_type: "video", position: "home_hero", status: "draft" });
            setMediaFile(null);
            fetchAds();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this ad?")) return;
        try {
            const res = await fetch(`/api/admin/ads?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Ad deleted");
                fetchAds();
            }
        } catch (e) { toast.error("Failed to delete"); }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return "bg-green-500/20 text-green-500 border-green-500/30";
            case 'draft': return "bg-slate-500/20 text-slate-500 border-slate-500/30";
            case 'scheduled': return "bg-blue-500/20 text-blue-500 border-blue-500/30";
            default: return "bg-slate-500/20 text-slate-500";
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black mb-2">Ad Campaigns</h1>
                    <p className="text-slate-400">Manage video promotions and featured offers</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                    <Plus size={20} /> Create Campaign
                </button>
            </div>

            {/* Main Content */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading campaigns...</div>
                ) : ads.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <FileVideo size={48} className="text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold text-slate-300">No campaigns yet</h3>
                        <p className="text-slate-500 mb-6">Create your first video ad to start promoting</p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="text-purple-400 font-bold hover:underline"
                        >
                            Create Now
                        </button>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-white/5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Campaign</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Position</th>
                                <th className="p-4 text-center">Impressions</th>
                                <th className="p-4 text-center">Clicks</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {ads.map((ad) => (
                                <tr key={ad.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-10 rounded bg-slate-800 flex-shrink-0 overflow-hidden relative">
                                                {ad.media_type === 'video' ? (
                                                    <video src={ad.media_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={ad.media_url || ''} alt="" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{ad.title}</p>
                                                <p className="text-xs text-slate-500 line-clamp-1">{ad.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(ad.status)} uppercase`}>
                                            {ad.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-300 capitalize">{ad.position.replace('_', ' ')}</td>
                                    <td className="p-4 text-center font-mono text-slate-400">{ad.impressions.toLocaleString()}</td>
                                    <td className="p-4 text-center font-mono text-slate-400">{ad.clicks.toLocaleString()}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleDelete(ad.id)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Creation Modal */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#111] z-10">
                                <h2 className="text-2xl font-black">New Campaign</h2>
                                <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-white/10 rounded-full">
                                    <XCircle size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400">Title</label>
                                        <input
                                            required
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-purple-500 transition-colors"
                                            placeholder="e.g. Summer Sale Video"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400">Position</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-purple-500"
                                            value={formData.position}
                                            onChange={e => setFormData({ ...formData, position: e.target.value })}
                                        >
                                            <option value="home_hero">Home Hero (Video)</option>
                                            <option value="sidebar">Sidebar Banner</option>
                                            <option value="popup">Flash Sale Popup</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-purple-500 h-24"
                                        placeholder="Ad copy text..."
                                    />
                                </div>

                                {/* File Upload Area */}
                                <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-colors bg-white/[0.02]">
                                    <div className="flex flex-col items-center text-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                            {mediaFile ? <CheckCircle className="text-green-500" size={32} /> : <Upload className="text-purple-500" size={32} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg mb-1">{mediaFile ? mediaFile.name : "Upload Video or Image"}</p>
                                            <p className="text-sm text-slate-500">MP4, WebM, JPG, PNG up to 50MB</p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="video/*,image/*"
                                            onChange={e => e.target.files && setMediaFile(e.target.files[0])}
                                            className="block w-full text-sm text-slate-500
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-full file:border-0
                                      file:text-sm file:font-semibold
                                      file:bg-purple-600 file:text-white
                                      hover:file:bg-purple-700
                                      cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400">Target URL</label>
                                        <input
                                            value={formData.target_url || ''}
                                            onChange={e => setFormData({ ...formData, target_url: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400">Status</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-purple-500"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="active">Active</option>
                                            <option value="scheduled">Scheduled</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-end gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="px-6 py-3 text-slate-300 hover:text-white font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {uploading ? <Loader2 className="animate-spin" /> : "Save Campaign"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
