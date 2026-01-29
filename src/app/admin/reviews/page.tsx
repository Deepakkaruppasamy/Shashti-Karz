"use client";

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, CheckCircle2, XCircle, Send, Trash2, ExternalLink, Image as ImageIcon, Brain, TrendingUp, TrendingDown, BarChart3, Search, Sparkles, Shield, AlertTriangle, Download, FileText, Loader2, Minus, Clock } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import type { Review } from "@/lib/types";

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

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
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

  const handleApprove = async (id: string, approved: boolean) => {
    const res = await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    if (res.ok) {
      toast.success(approved ? "Review approved!" : "Review hidden");
      loadReviews();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Review deleted");
      loadReviews();
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
        toast.success("Response posted!");
        setResponse("");
        loadReviews();
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

  const requestGoogleReview = async (review: Review) => {
    await fetch("/api/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "919876543210",
        template_name: "review_request",
        params: [review.name, review.service, "https://g.page/r/shashti-karz/review"],
      }),
    });
    toast.success("Review request sent via WhatsApp!");
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
    <div className="py-4 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Review Management</h1>
            <p className="text-[#888]">AI-powered service insights & feedback</p>
          </div>
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
            <button
              onClick={() => setActiveTab("list")}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === "list" ? "bg-[#ff1744] text-white" : "text-[#888] hover:text-white"}`}
            >
              Review List
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === "analytics" ? "bg-[#ff1744] text-white" : "text-[#888] hover:text-white"}`}
            >
              AI Analytics
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "list" ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid sm:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total Reviews", value: reviews.length, icon: MessageSquare, color: "from-blue-500 to-cyan-500" },
                  { label: "Pending", value: pendingCount, icon: Clock, color: pendingCount > 0 ? "from-yellow-500 to-orange-500" : "from-green-500 to-emerald-500" },
                  { label: "Avg Rating", value: avgRating, icon: Star, color: "from-[#d4af37] to-[#ffd700]" },
                  { label: "Flagged", value: reviews.filter(r => r.flagged).length, icon: AlertTriangle, color: "from-red-500 to-pink-500" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card rounded-2xl p-6"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                      <stat.icon size={24} className="text-white" />
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-[#888]">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-semibold">Recent Reviews</h2>
                      <div className="flex gap-2">
                        {(["all", "pending", "approved", "flagged"] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm capitalize transition-all ${filter === f ? "bg-[#ff1744] text-white" : "bg-white/5 text-[#888] hover:text-white"
                              }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {isLoading ? (
                      <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto" />
                      </div>
                    ) : filteredReviews.length === 0 ? (
                      <div className="text-center py-12 text-[#888]">
                        <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No reviews found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredReviews.map((review) => (
                          <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl cursor-pointer transition-all ${selectedReview?.id === review.id
                              ? "bg-[#ff1744]/10 border-2 border-[#ff1744]"
                              : "bg-white/5 border-2 border-transparent hover:border-white/10"
                              } ${!review.approved ? "border-l-4 border-l-yellow-500" : ""}`}
                            onClick={() => { setSelectedReview(review); setResponse(review.admin_response || ""); }}
                          >
                            <div className="flex items-start gap-4">
                              <Image
                                src={review.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"}
                                alt={review.name}
                                width={48}
                                height={48}
                                className="rounded-full object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold">{review.name}</h4>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        size={14}
                                        className={i < review.rating ? "text-[#d4af37] fill-[#d4af37]" : "text-[#444]"}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-sm text-[#888]">{review.car} • {review.service}</p>
                                <p className="text-sm mt-2 line-clamp-2">{review.comment}</p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleApprove(review.id, !review.approved); }}
                                  className={`p-2 rounded-lg ${review.approved ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                                    }`}
                                >
                                  {review.approved ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(review.id); }}
                                  className="p-2 rounded-lg bg-red-500/10 text-red-500"
                                >
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

                <div className="lg:col-span-1">
                  {selectedReview ? (
                    <div className="glass-card rounded-2xl p-6 sticky top-28">
                      <h3 className="font-semibold mb-4">Review Details</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Image
                            src={selectedReview.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"}
                            alt={selectedReview.name}
                            width={56}
                            height={56}
                            className="rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-semibold">{selectedReview.name}</h4>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={i < selectedReview.rating ? "text-[#d4af37] fill-[#d4af37]" : "text-[#444]"}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5">
                          <p className="text-sm">&quot;{selectedReview.comment}&quot;</p>
                        </div>

                        <div className="text-sm text-[#888]">
                          <p>Service: {selectedReview.service}</p>
                          <p>Vehicle: {selectedReview.car}</p>
                          <p>Date: {new Date(selectedReview.created_at).toLocaleDateString()}</p>
                        </div>

                        <div>
                          <label className="block text-sm text-[#888] mb-2">Your Response</label>
                          <textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="Thank you for your feedback..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none resize-none text-sm"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleResponse}
                            disabled={!response.trim() || isSubmitting}
                            className="flex-1 btn-premium px-4 py-2 rounded-xl text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <Send size={14} />
                            Post Response
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-card rounded-2xl p-6 text-center">
                      <MessageSquare size={48} className="mx-auto text-[#888] mb-4" />
                      <h3 className="font-medium mb-2">Select a Review</h3>
                      <p className="text-sm text-[#888]">Click on a review to respond or manage</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* AI Assistant Card */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="glass-card rounded-2xl p-6 border border-[#ff1744]/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff1744]/10 rounded-full blur-3xl" />
                    <div className="flex items-center gap-3 mb-6 relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center shadow-lg shadow-[#ff1744]/20">
                        <Brain className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold">Shashti Review AI</h3>
                        <p className="text-xs text-[#888]">Ask anything about your feedback</p>
                      </div>
                    </div>

                    <div className="space-y-4 relative">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 min-h-[100px] text-sm text-[#ccc] italic">
                        {isAiLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="animate-spin" size={16} />
                            <span>Analyzing sentiment patterns...</span>
                          </div>
                        ) : aiAnswer ? (
                          aiAnswer
                        ) : (
                          "Try: 'Why did my rating drop recently?' or 'What are customers saying about the price?'"
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={aiQuery}
                          onChange={(e) => setAiQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAiQuery()}
                          placeholder="Type your question..."
                          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none text-sm"
                        />
                        <button
                          onClick={handleAiQuery}
                          className="p-3 rounded-xl bg-[#ff1744] text-white hover:bg-[#ff1744]/80 transition-all"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-6 space-y-4">
                    <h3 className="font-bold flex items-center gap-2">
                      <Download size={18} className="text-[#ff1744]" />
                      Reports & Downloads
                    </h3>
                    <button
                      onClick={() => downloadReport("pdf")}
                      className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#ff1744]/30 flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-red-400" />
                        <div className="text-left">
                          <div className="text-sm font-medium">Monthly Trends PDF</div>
                          <div className="text-[10px] text-[#666]">Detailed sentiment analysis</div>
                        </div>
                      </div>
                      <Download size={16} className="text-[#888] group-hover:text-white" />
                    </button>
                    <button
                      onClick={() => downloadReport("excel")}
                      className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:border-green-500/30 flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <BarChart3 size={20} className="text-green-400" />
                        <div className="text-left">
                          <div className="text-sm font-medium">Full Raw Data (Excel)</div>
                          <div className="text-[10px] text-[#666]">All comments & AI scores</div>
                        </div>
                      </div>
                      <Download size={16} className="text-[#888] group-hover:text-white" />
                    </button>
                  </div>
                </div>

                {/* Charts & Trends Card */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-card rounded-2xl p-6 h-full">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <BarChart3 size={24} className="text-[#d4af37]" />
                        Sentiment Analysis
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-xs text-[#888]">Positive</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <span className="text-xs text-[#888]">Neutral</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-xs text-[#888]">Negative</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-6 mb-8">
                      <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/10 text-center">
                        <TrendingUp className="mx-auto text-green-500 mb-3" size={32} />
                        <div className="text-3xl font-bold text-green-500">
                          {Math.round((reviews.filter(r => r.sentiment_label === 'Positive').length / (reviews.length || 1)) * 100)}%
                        </div>
                        <div className="text-sm text-[#888]">Positive Experience</div>
                      </div>
                      <div className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 text-center">
                        <Minus className="mx-auto text-yellow-500 mb-3" size={32} />
                        <div className="text-3xl font-bold text-yellow-500">
                          {Math.round((reviews.filter(r => r.sentiment_label === 'Neutral').length / (reviews.length || 1)) * 100)}%
                        </div>
                        <div className="text-sm text-[#888]">Neutral Sentiment</div>
                      </div>
                      <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 text-center">
                        <TrendingDown className="mx-auto text-red-500 mb-3" size={32} />
                        <div className="text-3xl font-bold text-red-500">
                          {Math.round((reviews.filter(r => r.sentiment_label === 'Negative').length / (reviews.length || 1)) * 100)}%
                        </div>
                        <div className="text-sm text-[#888]">Room for Improvement</div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="font-bold flex items-center gap-2">
                        <Sparkles size={18} className="text-[#ff1744]" />
                        AI-Detected Key Themes
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {["Quality", "Punctuality", "Pricing", "Staff Behavior", "Cleanliness", "Communication"].map((theme) => {
                          const count = reviews.filter(r => r.ai_metadata?.themes?.includes(theme.toLowerCase())).length;
                          const percentage = Math.round((count / (reviews.length || 1)) * 100);
                          return (
                            <div key={theme} className="flex-1 min-w-[150px] p-4 rounded-xl bg-white/5 border border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{theme}</span>
                                <span className="text-xs text-[#888]">{count} mentions</span>
                              </div>
                              <div className="h-2 rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#ff1744] to-[#d4af37]"
                                  style={{ width: `${percentage}%` }}
                                />
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
  );
}
