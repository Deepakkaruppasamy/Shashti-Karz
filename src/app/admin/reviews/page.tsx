"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
  Sparkles, Brain, Zap, Activity, RefreshCw, BarChart3, TrendingUp, TrendingDown, Target, ShieldCheck,
  Star, MessageSquare, Clock, CheckCircle2, Trash2, Send, Download, FileText, ExternalLink, X
} from "lucide-react";

import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Review } from "@/lib/types";
import { BrandedLoader } from "@/components/animations/BrandedLoader";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "analytics">("list");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "flagged">("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [smartSummary, setSmartSummary] = useState<string>("");

  // Real-time subscription
  useRealtimeSubscription<Review>({
    table: "reviews",
    onInsert: (newReview) => {
      setReviews((prev) => [newReview, ...prev]);
      toast.success(`New ${newReview.rating}-star review from ${newReview.name}!`, {
        icon: '🌟',
        description: newReview.comment.substring(0, 50) + '...'
      });
    },
    onUpdate: (updatedReview) => {
      setReviews((prev) => prev.map((r) => (r.id === updatedReview.id ? updatedReview : r)));
    },
    onDelete: (payload) => {
      setReviews((prev) => prev.filter((r) => r.id !== payload.old.id));
    },
  });

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    if (reviews.length > 0 && !smartSummary) {
      generateSmartSummary();
    }
  }, [reviews]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reviews?admin=true");
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateSmartSummary = async () => {
    try {
      const res = await fetch("/api/ai/admin-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "Provide a 2-sentence executive summary of recent customer sentiment. Identify the single biggest pain point and the most praised aspect.",
          context: { type: "reviews_summary", reviews: reviews.slice(0, 20) }
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSmartSummary(data.response);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    const res = await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    if (res.ok) {
      toast.success(approved ? "Review approved and visible!" : "Review hidden from public");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Review permanently removed");
      if (selectedReview?.id === id) setSelectedReview(null);
    }
  };

  const handleResponse = async () => {
    if (!selectedReview || !response.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${selectedReview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_response: response,
          replied_at: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        toast.success("Public response updated");
        setResponse("");
        setSelectedReview(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/admin-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: aiQuery,
          context: {
            type: "reviews_analytics",
            reviews: reviews.map(r => ({ rating: r.rating, comment: r.comment, sentiment: r.sentiment_label, themes: r.ai_metadata?.themes }))
          }
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnswer(data.response);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const downloadReport = (type: "pdf" | "excel") => {
    if (type === "excel") {
      const data = reviews.map(r => ({
        Customer: r.name,
        Rating: r.rating,
        Comment: r.comment,
        Sentiment: r.sentiment_label || "N/A",
        Service: r.service,
        Date: new Date(r.created_at).toLocaleDateString()
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reviews");
      XLSX.writeFile(wb, "Service_Reviews_Report.xlsx");
    } else {
      const doc = new jsPDF();
      doc.text("Service Reviews Analytics Report", 20, 20);
      doc.text(`Total Reviews: ${reviews.length}`, 20, 30);
      doc.text(`Average Rating: ${avgRating}`, 20, 40);
      doc.save("Service_Reviews_Report.pdf");
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === "pending") return !r.approved;
    if (filter === "approved") return r.approved;
    if (filter === "flagged") return r.flagged;
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.approved).length;
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0";

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">

      <div className="flex-1 overflow-auto pb-24 lg:pb-8">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tighter flex items-center gap-3">
                <Star className="text-[#d4af37] fill-[#d4af37]" />
                Feedback Echo
              </h1>
              <p className="text-[#888] mt-1 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live Reputation Monitoring
              </p>
            </div>
            <div className="flex items-center gap-2 p-1 lg:p-1.5 glass-card rounded-2xl border border-white/5 bg-white/5">
              {(["list", "analytics"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 md:flex-initial px-4 lg:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? "bg-[#ff1744] text-white shadow-lg shadow-[#ff1744]/20" : "text-[#888] hover:text-white"}`}
                >
                  {tab === "list" ? "Inbox" : "Insights"}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "list" ? (
              <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {/* AI Smart Summary Bar */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-8 p-4 lg:p-6 glass-card rounded-2xl lg:rounded-[2.5rem] border border-[#d4af37]/20 bg-gradient-to-r from-[#d4af37]/10 to-transparent flex flex-col sm:flex-row items-center gap-4 lg:gap-6"
                >
                  <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-[1.5rem] bg-gradient-to-br from-[#d4af37] to-[#ffd700] flex items-center justify-center shrink-0 shadow-lg">
                    <Sparkles className="text-[#0a0a0a]" size={24} />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                      <h2 className="font-black uppercase tracking-widest text-[10px] text-[#d4af37]">AI Reputation Pulse</h2>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <button onClick={generateSmartSummary} className="text-[10px] font-black underline uppercase text-[#888] hover:text-white transition-colors">Regenerate</button>
                    </div>
                    <p className="text-xs lg:text-sm text-[#ccc] leading-relaxed italic">
                      {smartSummary || "Synthesizing recent feedback clusters..."}
                    </p>
                  </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Inbox", value: reviews.length, icon: MessageSquare, color: "text-blue-500" },
                    { label: "Action", value: pendingCount, icon: Clock, color: pendingCount > 0 ? "text-orange-500" : "text-green-500" },
                    { label: "Rating", value: avgRating, icon: Star, color: "text-[#d4af37]" },
                    { label: "Flagged", value: reviews.filter(r => r.flagged).length, icon: ShieldCheck, color: "text-red-500" },
                  ].map((stat, i) => (
                    <div key={i} className="glass-card rounded-2xl p-4 lg:p-6 border border-white/5 flex items-center gap-3 lg:gap-4">
                      <div className={`p-2 lg:p-3 rounded-xl bg-white/5 ${stat.color}`}>
                        <stat.icon size={18} className="lg:w-5 lg:h-5" />
                      </div>
                      <div>
                        <div className="text-xl lg:text-2xl font-black tracking-tighter">{stat.value}</div>
                        <div className="text-[8px] lg:text-[10px] font-black text-[#666] uppercase tracking-widest">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h3 className="text-[10px] font-black text-[#555] uppercase tracking-[0.3em] ml-1">Live Feed</h3>
                      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
                        {(["all", "pending", "approved"] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${filter === f ? "bg-white text-[#0a0a0a] border-white" : "text-[#888] border-white/10 hover:border-white/30"}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {isLoading ? (
                      <BrandedLoader className="py-20" />
                    ) : (
                      <div className="space-y-4">
                        {filteredReviews.map((review) => (
                          <motion.div
                            key={review.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`glass-card rounded-3xl p-4 lg:p-6 border-2 transition-all cursor-pointer relative overflow-hidden group ${selectedReview?.id === review.id ? "border-[#ff1744]/40 bg-[#ff1744]/5" : "border-white/5 hover:border-white/10"}`}
                            onClick={() => { setSelectedReview(review); setResponse(review.admin_response || ""); }}
                          >
                            <div className="flex items-start gap-4 lg:gap-5 relative">
                              <div className="relative shrink-0">
                                <Image src={review.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"} alt={review.name} width={48} height={48} className="rounded-xl lg:rounded-2xl object-cover ring-2 ring-white/5 lg:w-[50px] lg:h-[50px]" />
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center text-[8px] font-black border-2 border-[#0a0a0a] ${review.rating >= 4 ? "bg-green-500" : "bg-red-500"}`}>
                                  {review.rating}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-bold text-white text-sm lg:text-base group-hover:text-[#ff1744] transition-colors truncate pr-2">{review.name}</h4>
                                  <span className="text-[8px] lg:text-[9px] font-black text-[#444] uppercase tracking-widest shrink-0">{new Date(review.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                  <span className="text-[8px] lg:text-[9px] font-black uppercase text-[#444] border border-white/5 px-2 py-0.5 rounded-md">{review.service}</span>
                                  {review.admin_response && <span className="text-[8px] lg:text-[9px] font-black uppercase text-green-500 flex items-center gap-1"><CheckCircle2 size={10} /> Replied</span>}
                                </div>
                                <p className="text-xs lg:text-sm text-[#aaa] leading-relaxed line-clamp-2 italic">&quot;{review.comment}&quot;</p>
                              </div>
                              <div className="hidden sm:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleApprove(review.id, !review.approved); }}
                                  className={`p-2 rounded-xl transition-all ${review.approved ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"}`}
                                >
                                  {review.approved ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(review.id); }}
                                  className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            {/* Mobile Actions */}
                            <div className="flex sm:hidden items-center gap-2 mt-4 pt-4 border-t border-white/5 justify-end">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleApprove(review.id, !review.approved); }}
                                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${review.approved ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}
                              >
                                {review.approved ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                {review.approved ? "Approved" : "Pending"}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(review.id); }}
                                className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Inspector Panel - Modal on Mobile, Sidebar on Desktop */}
                  <div className="lg:col-span-1">
                    <AnimatePresence>
                      {selectedReview && (
                        <>
                          {/* Desktop Side Panel */}
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="hidden lg:block glass-card rounded-[2.5rem] p-8 space-y-8 border border-white/5 sticky top-28"
                          >
                            <div>
                              <h3 className="text-[10px] font-black text-[#555] uppercase tracking-[0.3em] mb-6">Review Inspector</h3>
                              <div className="flex items-center gap-4 mb-6">
                                <Image src={selectedReview.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"} alt={selectedReview.name} width={64} height={64} className="rounded-2xl" />
                                <div>
                                  <h4 className="text-xl font-black">{selectedReview.name}</h4>
                                  <div className="flex items-center gap-1 mt-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={14} className={i < selectedReview.rating ? "text-[#d4af37] fill-[#d4af37]" : "text-[#222]"} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 relative">
                                <Sparkles className="absolute -top-2 -right-2 text-[#d4af37]/20" size={32} />
                                <p className="text-sm font-medium leading-relaxed italic text-[#888]">&quot;{selectedReview.comment}&quot;</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-[#444] uppercase tracking-widest">Public Response</label>
                                <Brain size={12} className="text-[#ff1744] animate-pulse" />
                              </div>
                              <textarea
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                placeholder="Address concerns or express gratitude..."
                                className="w-full h-40 px-6 py-5 rounded-[2rem] bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none transition-all text-sm leading-relaxed"
                              />
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={handleResponse}
                                disabled={!response.trim() || isSubmitting}
                                className="flex-1 btn-premium py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {isSubmitting ? <RefreshCw className="animate-spin" size={14} /> : <Send size={14} />}
                                Broadcast Reply
                              </button>
                              <button onClick={() => setSelectedReview(null)} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                <X size={20} />
                              </button>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                  <div className="text-[8px] font-black text-[#444] uppercase tracking-widest mb-1">Sentiment</div>
                                  <div className={`text-[10px] font-black uppercase ${selectedReview.sentiment_label === 'Positive' ? 'text-green-500' : 'text-red-500'}`}>{selectedReview.sentiment_label || 'Neutral'}</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                  <div className="text-[8px] font-black text-[#444] uppercase tracking-widest mb-1">Category</div>
                                  <div className="text-[10px] font-black uppercase text-white">{selectedReview.service.split(' ')[0]}</div>
                                </div>
                              </div>
                            </div>
                          </motion.div>

                          {/* Mobile Bottom Sheet */}
                          <div className="lg:hidden fixed inset-0 z-[60] flex items-end justify-center px-4 pb-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedReview(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                            <motion.div
                              initial={{ y: "100%" }}
                              animate={{ y: 0 }}
                              exit={{ y: "100%" }}
                              className="w-full max-w-lg glass-card rounded-[2rem] border border-white/10 p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
                            >
                              <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                  <Image src={selectedReview.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"} alt={selectedReview.name} width={50} height={50} className="rounded-xl" />
                                  <div>
                                    <h4 className="font-black text-white">{selectedReview.name}</h4>
                                    <div className="flex gap-0.5">
                                      {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={10} className={i < selectedReview.rating ? "text-[#d4af37] fill-[#d4af37]" : "text-[#222]"} />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <button onClick={() => setSelectedReview(null)} className="p-2 rounded-full bg-white/5 border border-white/10">
                                  <X size={20} />
                                </button>
                              </div>

                              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 italic text-sm text-[#888] mb-6">
                                &quot;{selectedReview.comment}&quot;
                              </div>

                              <div className="space-y-3 mb-6">
                                <label className="text-[10px] font-black text-[#555] uppercase tracking-widest px-1">Voice your response</label>
                                <textarea
                                  value={response}
                                  onChange={(e) => setResponse(e.target.value)}
                                  placeholder="Type your official reply..."
                                  className="w-full h-32 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none text-sm"
                                />
                              </div>

                              <button
                                onClick={handleResponse}
                                disabled={!response.trim() || isSubmitting}
                                className="w-full btn-premium py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                              >
                                {isSubmitting ? <RefreshCw className="animate-spin" size={14} /> : <Send size={14} />}
                                Submit Public Reply
                              </button>
                            </motion.div>
                          </div>
                        </>
                      )}

                      {!selectedReview && (
                        <div className="hidden lg:block glass-card rounded-[2.5rem] p-12 text-center border border-dashed border-white/10">
                          <Activity size={48} className="mx-auto text-[#222] mb-4" />
                          <h3 className="font-bold mb-2">Shadow Control</h3>
                          <p className="text-xs text-[#444] uppercase font-black tracking-widest">Select a pulse from the feed</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 lg:space-y-8">
                <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
                  {/* AI Interface */}
                  <div className="lg:col-span-4 space-y-6 lg:space-y-8">
                    <div className="glass-card rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 border border-[#ff1744]/20 bg-gradient-to-br from-[#ff1744]/5 to-transparent relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff1744]/10 rounded-full blur-[80px]" />
                      <div className="flex items-center gap-4 mb-6 lg:mb-8">
                        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center shadow-2xl shadow-[#ff1744]/20">
                          <Brain className="text-white" size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg lg:text-xl font-black tracking-tighter">Review Matrix AI</h3>
                          <p className="text-[10px] font-black text-[#ff1744] uppercase tracking-widest">Sentiment Query</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] bg-white/[0.03] border border-white/5 min-h-[140px] text-xs lg:text-sm leading-relaxed text-[#ccc] italic transition-all overflow-y-auto max-h-[300px] whitespace-pre-line">
                          {isAiLoading ? "Processing data matrix..." : (aiAnswer || "Query the artificial intelligence about reputation trends...")}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAiQuery()}
                            placeholder="Type command..."
                            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none text-xs lg:text-sm"
                          />
                          <button
                            onClick={handleAiQuery}
                            className="p-3 lg:p-4 rounded-xl bg-[#ff1744] text-white transition-all shadow-lg shadow-[#ff1744]/20 flex-shrink-0"
                          >
                            <Zap size={18} fill="currentColor" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 space-y-4">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444] flex items-center gap-2 mb-2">
                        <Download size={14} /> Exports
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        <button onClick={() => downloadReport("pdf")} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group">
                          <div className="flex items-center gap-3 text-red-500">
                            <FileText size={18} />
                            <span className="text-[10px] font-black uppercase text-[#888] group-hover:text-white">Reputation_Report.pdf</span>
                          </div>
                          <ExternalLink size={12} className="text-[#222]" />
                        </button>
                        <button onClick={() => downloadReport("excel")} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group">
                          <div className="flex items-center gap-3 text-green-500">
                            <BarChart3 size={18} />
                            <span className="text-[10px] font-black uppercase text-[#888] group-hover:text-white">Metric_Lake.xlsx</span>
                          </div>
                          <ExternalLink size={12} className="text-[#222]" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Visualization */}
                  <div className="lg:col-span-8 space-y-6 lg:space-y-8">
                    <div className="glass-card rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 relative overflow-hidden">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 lg:mb-12 gap-6">
                        <div>
                          <h3 className="text-xl lg:text-2xl font-black tracking-tighter flex items-center gap-3">
                            <Target className="text-[#d4af37]" />
                            Sentiment Vector
                          </h3>
                          <p className="text-[10px] font-black text-[#444] uppercase tracking-widest mt-1">Algorithmic Distribution</p>
                        </div>
                        <div className="flex gap-4 sm:gap-6">
                          {['Positive', 'Neutral', 'Negative'].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${s === 'Positive' ? 'bg-green-500' : s === 'Neutral' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                              <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-[#444]">{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-8 mb-8 lg:mb-12">
                        {[
                          { label: "Optimal Flow", value: Math.round((reviews.filter(r => r.sentiment_label === 'Positive').length / (reviews.length || 1)) * 100), color: "text-green-500", bg: "bg-green-500/5", icon: TrendingUp },
                          { label: "Stability", value: Math.round((reviews.filter(r => r.sentiment_label === 'Neutral').length / (reviews.length || 1)) * 100), color: "text-yellow-500", bg: "bg-yellow-500/5", icon: Activity },
                          { label: "Risk Leakage", value: Math.round((reviews.filter(r => r.sentiment_label === 'Negative').length / (reviews.length || 1)) * 100), color: "text-red-500", bg: "bg-red-500/5", icon: TrendingDown },
                        ].map((stat, i) => (
                          <div key={i} className={`p-6 lg:p-8 rounded-2xl lg:rounded-[2.5rem] ${stat.bg} border border-white/5 relative`}>
                            <stat.icon className={`absolute top-4 right-4 ${stat.color} opacity-20`} size={32} />
                            <div className={`text-3xl lg:text-5xl font-black tracking-tighter ${stat.color} mb-1 lg:mb-2`}>{stat.value}%</div>
                            <div className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-[#444]">{stat.label}</div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-6 lg:space-y-8">
                        <div className="flex items-center justify-between px-1">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#444]">Density Matrix</h4>
                          <Sparkles size={10} className="text-[#d4af37]" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {["Quality", "Punctuality", "Staff", "Vibe", "Value", "Wash"].map((theme) => {
                            const count = reviews.filter(r => r.ai_metadata?.themes?.includes(theme.toLowerCase()) || r.comment.toLowerCase().includes(theme.toLowerCase())).length;
                            const percentage = Math.round((count / (reviews.length || 1)) * 100);
                            return (
                              <div key={theme} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 transition-all group">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-[#888]">{theme}</span>
                                  <span className="text-[8px] font-black uppercase text-[#444]">{count} Hits</span>
                                </div>
                                <div className="h-1 lg:h-1.5 rounded-full bg-white/5 overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className="h-full bg-gradient-to-r from-[#ff1744] to-[#d4af37]" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
