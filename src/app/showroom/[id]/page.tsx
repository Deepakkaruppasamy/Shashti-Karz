"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Heart, MessageCircle, Share2, Eye, ArrowLeft,
    Send, Calendar, Clock, Trophy, Star, Shield,
    User, Car, CheckCircle2, ChevronRight
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";
import type { ShowroomPost, ShowroomComment } from "@/lib/types";

export default function PostDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [post, setPost] = useState<ShowroomPost | null>(null);
    const [comments, setComments] = useState<ShowroomComment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadPostData();
    }, [id]);

    const loadPostData = async () => {
        setIsLoading(true);
        try {
            const [postRes, commentsRes] = await Promise.all([
                fetch(`/api/showroom/posts/${id}`),
                fetch(`/api/showroom/posts/${id}/comments`)
            ]);

            if (postRes.ok) {
                const postData = await postRes.json();
                setPost(postData);
            }

            if (commentsRes.ok) {
                const commentsData = await commentsRes.json();
                setComments(commentsData);
            }
        } catch (error) {
            console.error("Error loading post:", error);
            toast.error("Failed to load post");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async () => {
        if (!user) {
            toast.error("Please login to like posts");
            return;
        }

        try {
            const res = await fetch(`/api/showroom/posts/${id}/like`, {
                method: "POST",
            });
            const data = await res.json();

            if (res.ok && post) {
                setPost({
                    ...post,
                    is_liked: data.liked,
                    likes_count: post.likes_count + (data.liked ? 1 : -1)
                });
            }
        } catch (error) {
            toast.error("Failed to like post");
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error("Please login to comment");
            return;
        }
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/showroom/posts/${id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comment: newComment.trim() }),
            });

            if (res.ok) {
                const addedComment = await res.json();
                setComments([...comments, addedComment]);
                setNewComment("");
                if (post) setPost({ ...post, comments_count: post.comments_count + 1 });
                toast.success("Comment posted!");
            }
        } catch (error) {
            toast.error("Failed to post comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#ff1744] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Post not found</h1>
                <button
                    onClick={() => router.push("/showroom")}
                    className="btn-premium px-6 py-2 rounded-xl"
                >
                    Back to Showroom
                </button>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#0a0a0a]">
            <Navbar />

            <div className="pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Navigation */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-[#888] hover:text-white transition-colors mb-8 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Showroom
                    </button>

                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* Media Section */}
                        <div className="lg:col-span-8 space-y-6">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card rounded-3xl overflow-hidden bg-black/40 border-white/5"
                            >
                                <div className="relative aspect-video sm:aspect-[16/9]">
                                    {post.media_type === 'photo' ? (
                                        <img
                                            src={post.media_url}
                                            alt={post.title}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <video
                                            src={post.media_url}
                                            controls
                                            autoPlay
                                            className="w-full h-full aspect-video"
                                        />
                                    )}

                                    {post.featured && (
                                        <div className="absolute top-6 right-6 px-4 py-2 rounded-full bg-[#d4af37] text-black text-sm font-bold flex items-center gap-2 shadow-2xl">
                                            <Star size={16} fill="currentColor" />
                                            Featured Result
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Additional Info */}
                            <div className="glass-card rounded-2xl p-8">
                                <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
                                <p className="text-[#ccc] text-lg leading-relaxed whitespace-pre-wrap">
                                    {post.description}
                                </p>

                                <div className="flex flex-wrap gap-3 mt-6">
                                    {post.tags?.map((tag, i) => (
                                        <span key={i} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[#888]">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Transformation Comparison (If available) */}
                            {post.before_photo_url && (
                                <div className="glass-card rounded-2xl p-8">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <Clock size={20} className="text-[#ff1744]" />
                                        Transformation Details
                                    </h3>
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium text-[#888]">Before Detailing</p>
                                            <div className="aspect-video rounded-xl bg-white/5 overflow-hidden border border-white/10">
                                                <img src={post.before_photo_url} alt="Before" className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium text-[#d4af37]">After Signature Shine</p>
                                            <div className="aspect-video rounded-xl bg-white/5 overflow-hidden border border-[#d4af37]/30">
                                                <img src={post.media_url} alt="After" className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar / Interaction Section */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* User & Stats Card */}
                            <div className="glass-card rounded-2xl p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff1744] to-[#d4af37] p-0.5">
                                        <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center">
                                            <User size={28} className="text-white/20" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{post.user?.full_name || "Anonymous User"}</h3>
                                        <p className="text-sm text-[#888] flex items-center gap-1">
                                            <Car size={14} />
                                            {post.car_model || "Vehicle Enthusiast"}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 py-6 border-y border-white/5 mb-6">
                                    <div className="text-center">
                                        <div className="text-xl font-bold">{post.likes_count}</div>
                                        <div className="text-[10px] uppercase tracking-wider text-[#666]">Likes</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xl font-bold">{post.comments_count}</div>
                                        <div className="text-[10px] uppercase tracking-wider text-[#666]">Comments</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xl font-bold">{post.views_count}</div>
                                        <div className="text-[10px] uppercase tracking-wider text-[#666]">Views</div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={handleLike}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-300 ${post.is_liked
                                                ? "bg-[#ff1744] border-[#ff1744] text-white shadow-lg shadow-[#ff1744]/20"
                                                : "bg-white/5 border-white/10 text-[#888] hover:border-white/20 hover:text-white"
                                            }`}
                                    >
                                        <Heart size={20} className={post.is_liked ? "fill-white" : ""} />
                                        {post.is_liked ? "Liked" : "Like"}
                                    </button>
                                    <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-[#888] hover:text-white transition-colors">
                                        <Share2 size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Contest Status (If applicable) */}
                            {post.contest_entry && (
                                <div className="glass-card rounded-2xl p-6 border-l-4 border-[#ff1744]">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Trophy size={20} className="text-[#ff1744]" />
                                        <h4 className="font-bold">Contest Entry</h4>
                                    </div>
                                    <p className="text-sm text-[#888]">This post is competing for the monthly Detailing Master crown!</p>
                                    <button className="w-full mt-4 text-[#ff1744] text-sm font-semibold flex items-center justify-center gap-1 group">
                                        View Rankings
                                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            )}

                            {/* Comments Section */}
                            <div className="glass-card rounded-2xl p-6 h-[500px] flex flex-col">
                                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                                    <MessageCircle size={20} className="text-[#ff1744]" />
                                    Comments
                                    <span className="text-sm font-normal text-[#666] ml-auto">
                                        {comments.length}
                                    </span>
                                </h3>

                                <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide">
                                    {comments.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-[#666] text-sm italic">No comments yet. Share your thoughts!</p>
                                        </div>
                                    ) : (
                                        comments.map((comment) => (
                                            <div key={comment.id} className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-sm">
                                                            {comment.user?.full_name || "Community Member"}
                                                        </span>
                                                        <span className="text-[10px] text-[#444]">
                                                            {new Date(comment.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-[#ccc] leading-relaxed">
                                                        {comment.comment}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <form onSubmit={handleCommentSubmit} className="mt-6">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder={user ? "Write a comment..." : "Login to comment"}
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            disabled={!user || isSubmitting}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 focus:border-[#ff1744]/50 outline-none transition-colors text-sm"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!user || isSubmitting || !newComment.trim()}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#ff1744] text-white disabled:opacity-50 disabled:bg-white/10 transition-all"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
