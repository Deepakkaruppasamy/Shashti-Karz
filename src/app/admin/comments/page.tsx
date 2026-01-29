"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, CheckCircle, XCircle, Eye, EyeOff, Trash2, Flag, Lock, Unlock, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Comment {
    id: string;
    service_id: string;
    service?: { name: string };
    parent_id: string | null;
    user_name: string;
    content: string;
    is_admin: boolean;
    status: string;
    likes_count: number;
    replies_count: number;
    created_at: string;
}

export default function CommentsAdminPage() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'hidden'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedService, setSelectedService] = useState<string>('all');
    const [services, setServices] = useState<any[]>([]);

    // Fetch comments
    const fetchComments = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('service_comments')
                .select(`
          *,
          service:services(name)
        `)
                .is('parent_id', null)
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            if (selectedService !== 'all') {
                query = query.eq('service_id', selectedService);
            }

            const { data, error } = await query;

            if (error) throw error;
            setComments(data || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
            toast.error('Failed to load comments');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch services
    const fetchServices = async () => {
        const { data } = await supabase
            .from('services')
            .select('id, name')
            .order('name');
        setServices(data || []);
    };

    useEffect(() => {
        fetchComments();
        fetchServices();
    }, [filter, selectedService]);

    // Real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel('admin-comments')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'service_comments'
                },
                () => {
                    fetchComments();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Approve comment
    const handleApprove = async (id: string) => {
        try {
            const { error } = await supabase
                .from('service_comments')
                .update({ status: 'approved' })
                .eq('id', id);

            if (error) throw error;
            toast.success('Comment approved');
            fetchComments();
        } catch (error) {
            toast.error('Failed to approve comment');
        }
    };

    // Hide comment
    const handleHide = async (id: string) => {
        try {
            const { error } = await supabase
                .from('service_comments')
                .update({ status: 'hidden' })
                .eq('id', id);

            if (error) throw error;
            toast.success('Comment hidden');
            fetchComments();
        } catch (error) {
            toast.error('Failed to hide comment');
        }
    };

    // Delete comment
    const handleDelete = async (id: string) => {
        if (!confirm('Permanently delete this comment?')) return;

        try {
            const { error } = await supabase
                .from('service_comments')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Comment deleted');
            fetchComments();
        } catch (error) {
            toast.error('Failed to delete comment');
        }
    };

    // Toggle comments for service
    const handleToggleComments = async (serviceId: string, enabled: boolean) => {
        try {
            const { error } = await supabase
                .from('service_comment_settings')
                .upsert({
                    service_id: serviceId,
                    comments_enabled: !enabled
                });

            if (error) throw error;
            toast.success(`Comments ${!enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            toast.error('Failed to update settings');
        }
    };

    const stats = {
        total: comments.length,
        approved: comments.filter(c => c.status === 'approved').length,
        pending: comments.filter(c => c.status === 'pending').length,
        hidden: comments.filter(c => c.status === 'hidden').length
    };

    return (
        <div className="p-4 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display flex items-center gap-3">
                        <MessageCircle className="text-[#ff1744]" />
                        Comments Moderation
                    </h1>
                    <p className="text-[#888] mt-1">Manage and moderate service comments</p>
                </div>
                <button
                    onClick={fetchComments}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 text-[#888] hover:text-white"
                >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total', value: stats.total, color: 'from-blue-500 to-cyan-500' },
                    { label: 'Approved', value: stats.approved, color: 'from-green-500 to-emerald-500' },
                    { label: 'Pending', value: stats.pending, color: 'from-yellow-500 to-orange-500' },
                    { label: 'Hidden', value: stats.hidden, color: 'from-red-500 to-pink-500' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card rounded-2xl p-6"
                    >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                            <MessageCircle size={24} className="text-white" />
                        </div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-sm text-[#888]">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="glass-card rounded-2xl p-6 border border-white/5 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-[#888] uppercase mb-2 block">Status</label>
                        <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                            {['all', 'approved', 'pending', 'hidden'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? 'bg-[#ff1744] text-white shadow-lg' : 'text-[#888] hover:text-white'
                                        }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1">
                        <label className="text-xs font-bold text-[#888] uppercase mb-2 block">Service</label>
                        <select
                            value={selectedService}
                            onChange={(e) => setSelectedService(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
                        >
                            <option value="all">All Services</option>
                            {services.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Comments List */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="w-10 h-10 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-[#888] text-sm">Loading comments...</p>
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-20 text-[#888]">
                        <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No comments found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <motion.div
                                key={comment.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-xl border transition-colors ${comment.status === 'approved' ? 'bg-green-500/5 border-green-500/20' :
                                        comment.status === 'pending' ? 'bg-yellow-500/5 border-yellow-500/20' :
                                            'bg-red-500/5 border-red-500/20'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold">{comment.user_name}</span>
                                            {comment.is_admin && (
                                                <span className="px-2 py-0.5 rounded-full bg-[#ff1744]/20 text-[#ff1744] text-[10px] font-bold uppercase">
                                                    Admin
                                                </span>
                                            )}
                                            <span className="text-xs text-[#666]">
                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                            </span>
                                        </div>

                                        <p className="text-sm text-white/90 mb-2">{comment.content}</p>

                                        <div className="flex items-center gap-4 text-xs text-[#888]">
                                            <span>Service: {comment.service?.name || 'Unknown'}</span>
                                            <span>❤️ {comment.likes_count}</span>
                                            <span>💬 {comment.replies_count} replies</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {comment.status !== 'approved' && (
                                            <button
                                                onClick={() => handleApprove(comment.id)}
                                                className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                                title="Approve"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        )}

                                        {comment.status !== 'hidden' && (
                                            <button
                                                onClick={() => handleHide(comment.id)}
                                                className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                                                title="Hide"
                                            >
                                                <EyeOff size={18} />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
