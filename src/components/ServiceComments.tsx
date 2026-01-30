"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ThumbsUp, Reply, MoreVertical, Flag, Trash2, Edit2, Send, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import Link from 'next/link';

interface Comment {
    id: string;
    service_id: string;
    parent_id: string | null;
    user_id: string;
    user_name: string;
    user_avatar: string | null;
    content: string;
    is_admin: boolean;
    status: string;
    likes_count: number;
    replies_count: number;
    is_edited: boolean;
    edited_at: string | null;
    created_at: string;
    replies?: Comment[];
    user_liked?: boolean;
}

interface ServiceCommentsProps {
    serviceId: string;
    serviceName: string;
}

export function ServiceComments({ serviceId, serviceName }: ServiceCommentsProps) {
    const { user, profile } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [commentsEnabled, setCommentsEnabled] = useState(true);

    // Fetch comments
    const fetchComments = useCallback(async () => {
        try {
            // Get top-level comments
            const { data: topComments, error } = await supabase
                .from('service_comments')
                .select('*')
                .eq('service_id', serviceId)
                .is('parent_id', null)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Get all replies
            const { data: allReplies } = await supabase
                .from('service_comments')
                .select('*')
                .eq('service_id', serviceId)
                .not('parent_id', 'is', null)
                .eq('status', 'approved')
                .order('created_at', { ascending: true });

            // Get user's likes
            let userLikes: string[] = [];
            if (user) {
                const { data: likes } = await supabase
                    .from('comment_likes')
                    .select('comment_id')
                    .eq('user_id', user.id);
                userLikes = likes?.map(l => l.comment_id) || [];
            }

            // Build nested structure
            const commentsWithReplies = topComments?.map(comment => ({
                ...comment,
                user_liked: userLikes.includes(comment.id),
                replies: buildRepliesTree(comment.id, allReplies || [], userLikes)
            })) || [];

            setComments(commentsWithReplies);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching comments:', error);
            setIsLoading(false);
        }
    }, [serviceId, user]);

    // Build nested replies
    const buildRepliesTree = (parentId: string, allReplies: any[], userLikes: string[]): Comment[] => {
        const replies = allReplies.filter(r => r.parent_id === parentId);
        return replies.map(reply => ({
            ...reply,
            user_liked: userLikes.includes(reply.id),
            replies: buildRepliesTree(reply.id, allReplies, userLikes)
        }));
    };

    // Post new comment
    const handlePostComment = async () => {
        if (!newComment.trim() || !user) return;

        try {
            const { error } = await supabase
                .from('service_comments')
                .insert({
                    service_id: serviceId,
                    user_id: user.id,
                    user_name: profile?.full_name || user.email?.split('@')[0] || 'User',
                    user_email: user.email,
                    user_avatar: profile?.avatar_url,
                    content: newComment.trim(),
                    is_admin: profile?.role === 'admin',
                    status: 'approved'
                });

            if (error) throw error;

            setNewComment('');
            toast.success('Comment posted!');
            fetchComments();
        } catch (error) {
            console.error('Error posting comment:', error);
            toast.error('Failed to post comment');
        }
    };

    // Post reply
    const handlePostReply = async (parentId: string) => {
        if (!replyContent.trim() || !user) return;

        try {
            const { error } = await supabase
                .from('service_comments')
                .insert({
                    service_id: serviceId,
                    parent_id: parentId,
                    user_id: user.id,
                    user_name: profile?.full_name || user.email?.split('@')[0] || 'User',
                    user_email: user.email,
                    user_avatar: profile?.avatar_url,
                    content: replyContent.trim(),
                    is_admin: profile?.role === 'admin',
                    status: 'approved'
                });

            if (error) throw error;

            setReplyContent('');
            setReplyingTo(null);
            toast.success('Reply posted!');
            fetchComments();
        } catch (error) {
            console.error('Error posting reply:', error);
            toast.error('Failed to post reply');
        }
    };

    // Like/Unlike comment
    const handleLike = async (commentId: string, currentlyLiked: boolean) => {
        if (!user) {
            toast.error('Please sign in to like comments');
            return;
        }

        try {
            if (currentlyLiked) {
                // Unlike
                await supabase
                    .from('comment_likes')
                    .delete()
                    .eq('comment_id', commentId)
                    .eq('user_id', user.id);
            } else {
                // Like
                await supabase
                    .from('comment_likes')
                    .insert({
                        comment_id: commentId,
                        user_id: user.id
                    });
            }

            fetchComments();
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    // Delete comment
    const handleDelete = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;

        try {
            const { error } = await supabase
                .from('service_comments')
                .update({ status: 'deleted' })
                .eq('id', commentId);

            if (error) throw error;

            toast.success('Comment deleted');
            fetchComments();
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Failed to delete comment');
        }
    };

    // Real-time subscription
    useEffect(() => {
        fetchComments();

        const channel = supabase
            .channel(`service-comments-${serviceId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'service_comments',
                    filter: `service_id=eq.${serviceId}`
                },
                () => {
                    fetchComments();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comment_likes'
                },
                () => {
                    fetchComments();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [serviceId, fetchComments]);

    // Render single comment
    const renderComment = (comment: Comment, depth: number = 0) => (
        <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${depth > 0 ? 'ml-8 md:ml-12' : ''}`}
        >
            <div className="flex gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center text-white font-bold">
                        {comment.user_avatar ? (
                            <img src={comment.user_avatar} alt={comment.user_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            comment.user_name[0].toUpperCase()
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">{comment.user_name}</span>
                        {comment.is_admin && (
                            <span className="px-2 py-0.5 rounded-full bg-[#ff1744]/20 text-[#ff1744] text-[10px] font-bold uppercase">
                                Admin
                            </span>
                        )}
                        <span className="text-xs text-[#666]">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        {comment.is_edited && (
                            <span className="text-xs text-[#666]">(edited)</span>
                        )}
                    </div>

                    {editingId === comment.id ? (
                        <div className="space-y-2">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm resize-none focus:outline-none focus:border-[#ff1744]/50"
                                rows={2}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingId(null)}
                                    className="px-3 py-1 rounded-lg bg-white/5 text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {/* TODO: Implement edit */ }}
                                    className="px-3 py-1 rounded-lg bg-[#ff1744] text-white text-xs"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-white/90 whitespace-pre-wrap">{comment.content}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-3">
                        <button
                            onClick={() => handleLike(comment.id, comment.user_liked || false)}
                            className={`flex items-center gap-1.5 text-xs ${comment.user_liked ? 'text-[#ff1744]' : 'text-[#888]'} hover:text-[#ff1744] transition-colors`}
                        >
                            <ThumbsUp size={14} fill={comment.user_liked ? 'currentColor' : 'none'} />
                            {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
                        </button>

                        {depth < 2 && (
                            <button
                                onClick={() => setReplyingTo(comment.id)}
                                className="flex items-center gap-1.5 text-xs text-[#888] hover:text-white transition-colors"
                            >
                                <Reply size={14} />
                                Reply
                            </button>
                        )}

                        {user?.id === comment.user_id && (
                            <button
                                onClick={() => handleDelete(comment.id)}
                                className="flex items-center gap-1.5 text-xs text-[#888] hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>

                    {/* Reply Form */}
                    {replyingTo === comment.id && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 space-y-2"
                        >
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm resize-none focus:outline-none focus:border-[#ff1744]/50"
                                rows={2}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setReplyingTo(null);
                                        setReplyContent('');
                                    }}
                                    className="px-3 py-1 rounded-lg bg-white/5 text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handlePostReply(comment.id)}
                                    className="px-3 py-1 rounded-lg bg-[#ff1744] text-white text-xs flex items-center gap-1"
                                >
                                    <Send size={12} />
                                    Reply
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2 space-y-2">
                    {comment.replies.map(reply => renderComment(reply, depth + 1))}
                </div>
            )}
        </motion.div>
    );

    if (!commentsEnabled) {
        return (
            <div className="text-center py-12 text-[#888]">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
                <p>Comments are disabled for this service</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <MessageCircle className="text-[#ff1744]" />
                    Comments ({comments.length})
                </h3>
            </div>

            {/* New Comment Form */}
            {user ? (
                <div className="glass-card rounded-2xl p-4 border border-white/5">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={`Share your thoughts about ${serviceName}...`}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm resize-none focus:outline-none focus:border-[#ff1744]/50 mb-3"
                        rows={3}
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={handlePostComment}
                            disabled={!newComment.trim()}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={16} />
                            Post Comment
                        </button>
                    </div>
                </div>
            ) : (
                <div className="glass-card rounded-2xl p-6 border border-white/5 text-center">
                    <p className="text-[#888] mb-4">Sign in to join the conversation</p>
                    <Link href="/login" className="inline-block px-6 py-2 rounded-lg bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white text-sm font-bold">
                        Sign In
                    </Link>
                </div>
            )}

            {/* Comments List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#888] text-sm">Loading comments...</p>
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-12 text-[#888]">
                    <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No comments yet</p>
                    <p className="text-sm mt-2">Be the first to share your thoughts!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {comments.map(comment => renderComment(comment))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
