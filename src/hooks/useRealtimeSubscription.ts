"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions<T> {
    table: string;
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    filter?: string;
    onInsert?: (payload: T) => void;
    onUpdate?: (payload: T) => void;
    onDelete?: (payload: { old: T }) => void;
    enabled?: boolean;
}

export function useRealtimeSubscription<T = any>({
    table,
    event = '*',
    filter,
    onInsert,
    onUpdate,
    onDelete,
    enabled = true
}: UseRealtimeOptions<T>) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) return;

        let channel: RealtimeChannel;

        const setupSubscription = async () => {
            try {
                channel = supabase
                    .channel(`realtime-${table}-${Date.now()}`)
                    .on(
                        'postgres_changes',
                        {
                            event,
                            schema: 'public',
                            table,
                            filter
                        },
                        (payload: any) => {
                            setLastUpdate(new Date());
                            setError(null);

                            switch (payload.eventType) {
                                case 'INSERT':
                                    onInsert?.(payload.new as T);
                                    break;
                                case 'UPDATE':
                                    onUpdate?.(payload.new as T);
                                    break;
                                case 'DELETE':
                                    onDelete?.({ old: payload.old as T });
                                    break;
                            }
                        }
                    )
                    .subscribe((status) => {
                        if (status === 'SUBSCRIBED') {
                            setIsConnected(true);
                            setError(null);
                        } else if (status === 'CLOSED') {
                            setIsConnected(false);
                        } else if (status === 'CHANNEL_ERROR') {
                            setIsConnected(false);
                            setError('Connection error');
                        }
                    });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                setIsConnected(false);
            }
        };

        setupSubscription();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
                setIsConnected(false);
            }
        };
    }, [table, event, filter, enabled]);

    return { isConnected, lastUpdate, error };
}

// Hook for tracking online users
export function useOnlineUsers() {
    const [onlineCount, setOnlineCount] = useState(0);
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

    useEffect(() => {
        // Fetch initial online users
        const fetchOnlineUsers = async () => {
            const { data } = await supabase
                .from('online_users')
                .select('*')
                .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());

            if (data) {
                setOnlineUsers(data);
                setOnlineCount(data.length);
            }
        };

        fetchOnlineUsers();

        // Subscribe to changes
        const channel = supabase
            .channel('online-users-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'online_users' },
                () => {
                    fetchOnlineUsers();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Update presence
    const updatePresence = useCallback(async (userId: string, role: string, page: string) => {
        await supabase
            .from('online_users')
            .upsert({
                user_id: userId,
                role,
                page,
                last_seen: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });
    }, []);

    return { onlineCount, onlineUsers, updatePresence };
}

// Hook for real-time notifications
export function useRealtimeNotifications(userId?: string) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useRealtimeSubscription({
        table: 'notifications',
        event: 'INSERT',
        filter: userId ? `user_id=eq.${userId}` : undefined,
        onInsert: (notification) => {
            setNotifications(prev => [notification, ...prev]);
            if (!notification.read) {
                setUnreadCount(prev => prev + 1);
            }
        },
        enabled: !!userId
    });

    useRealtimeSubscription({
        table: 'notifications',
        event: 'UPDATE',
        filter: userId ? `user_id=eq.${userId}` : undefined,
        onUpdate: (notification) => {
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? notification : n)
            );
            // Recalculate unread count
            const unread = notifications.filter(n => !n.read).length;
            setUnreadCount(unread);
        },
        enabled: !!userId
    });

    const markAsRead = useCallback(async (notificationId: string) => {
        await supabase
            .from('notifications')
            .update({ read: true, read_at: new Date().toISOString() })
            .eq('id', notificationId);
    }, []);

    const markAllAsRead = useCallback(async () => {
        if (!userId) return;
        await supabase
            .from('notifications')
            .update({ read: true, read_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('read', false);
        setUnreadCount(0);
    }, [userId]);

    return { notifications, unreadCount, markAsRead, markAllAsRead };
}
