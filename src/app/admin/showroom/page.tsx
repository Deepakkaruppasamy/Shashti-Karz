"use client";

import { useState, useEffect } from "react";
import {
    Image as ImageIcon,
    MessageSquare,
    ThumbsUp,
    CheckCircle,
    XCircle,
    MoreVertical,
    Flag,
    Trash2,
    Eye,
    Search,
    Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { BrandedLoader } from "@/components/animations/BrandedLoader";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export default function ShowroomAdminPage() {
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<any[]>([]);
    const [filter, setFilter] = useState<"all" | "flagged" | "approved">("all");
    const [activeTab, setActiveTab] = useState<"posts" | "comments">("posts");

    const supabase = createClient();

    // Mock data for initial render
    const MOCK_POSTS = [
        {
            id: "1",
            user_name: "Arjun Reddy",
            car_model: "BMW M5 Competition",
            image_url: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop",
            caption: "Just got the ceramic coating done at Shashti! Look at that shine! ✨",
            status: "pending",
            likes: 124,
            comments_count: 12,
            posted_at: "2024-02-12T09:30:00Z"
        },
        {
            id: "2",
            user_name: "Priya S.",
            car_model: "Audi Q7",
            image_url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop",
            caption: "Best service in town.",
            status: "approved",
            likes: 85,
            comments_count: 5,
            posted_at: "2024-02-11T14:15:00Z"
        },
        {
            id: "3",
            user_name: "Rahul K.",
            car_model: "Mercedes C-Class",
            image_url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2070&auto=format&fit=crop",
            caption: "Spam content potentially here...",
            status: "flagged",
            likes: 2,
            comments_count: 0,
            posted_at: "2024-02-12T11:00:00Z"
        }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: postsData } = await supabase.from('showroom_posts').select('*');
            if (postsData && postsData.length > 0) setPosts(postsData);
            else setPosts(MOCK_POSTS);
        } catch (error) {
            console.error('Error loading showroom data:', error);
        } finally {
            setLoading(false);
        }
    };

    useRealtimeSubscription({
        table: 'showroom_posts',
        onInsert: (newItem) => {
            setPosts(prev => [newItem, ...prev]);
            toast.success('New showroom post submitted');
        },
        onUpdate: (updatedItem) => {
            setPosts(prev => prev.map(p => p.id === updatedItem.id ? updatedItem : p));
        },
        onDelete: (deletedItem) => {
            setPosts(prev => prev.filter(p => p.id !== deletedItem.old.id));
        }
    });

    const handleAction = (id: string, action: 'approve' | 'reject' | 'delete') => {
        toast.success(`Post ${action}d successfully`);
        // Optimistic update
        setPosts(prev => prev.map(p =>
            p.id === id ? { ...p, status: action === 'approve' ? 'approved' : 'rejected' } : p
        ));
        if (action === 'delete') {
            setPosts(prev => prev.filter(p => p.id !== id));
        }
    };

    if (loading) return <BrandedLoader fullPage />;

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-4 lg:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white mb-2 flex items-center gap-3">
                        <ImageIcon className="text-[#ff1744]" /> Community Showroom
                    </h1>
                    <p className="text-[#888]">Moderate user content and engage with the community</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab("posts")}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "posts"
                                ? 'bg-[#ff1744] text-white font-bold shadow-lg shadow-[#ff1744]/25'
                                : 'text-[#888] hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Posts
                    </button>
                    <button
                        onClick={() => setActiveTab("comments")}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "comments"
                                ? 'bg-[#ff1744] text-white font-bold shadow-lg shadow-[#ff1744]/25'
                                : 'text-[#888] hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Comments
                    </button>
                </div>
            </div>

            {activeTab === "posts" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                        <div key={post.id} className="glass-card rounded-2xl border border-white/5 overflow-hidden group">
                            <div className="relative aspect-video">
                                <img
                                    src={post.image_url}
                                    alt={post.car_model}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <span className={`px-2 py-1 rounde-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${post.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                                            post.status === 'flagged' ? 'bg-red-500/20 text-red-500' :
                                                'bg-yellow-500/20 text-yellow-500'
                                        }`}>
                                        {post.status}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center text-white font-bold text-xs">
                                        {post.user_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{post.user_name}</p>
                                        <p className="text-[10px] text-[#888]">{new Date(post.posted_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <h3 className="font-bold text-white mb-2">{post.car_model}</h3>
                                <p className="text-sm text-[#ccc] line-clamp-2 mb-4">{post.caption}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5 mb-4">
                                    <div className="flex gap-4 text-xs font-bold text-[#888]">
                                        <span className="flex items-center gap-1"><ThumbsUp size={14} /> {post.likes}</span>
                                        <span className="flex items-center gap-1"><MessageSquare size={14} /> {post.comments_count}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {post.status !== 'approved' && (
                                        <button
                                            onClick={() => handleAction(post.id, 'approve')}
                                            className="py-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 text-xs font-bold uppercase flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={14} /> Approve
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleAction(post.id, 'reject')}
                                        className="py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold uppercase flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={14} /> Reject
                                    </button>
                                    {post.status === 'approved' && (
                                        <button className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase col-span-2">
                                            View Details
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === "comments" && (
                <div className="glass-card rounded-2xl border border-white/5 p-12 text-center text-[#666]">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Comment moderation queue is empty.</p>
                </div>
            )}
        </div>
    );
}
