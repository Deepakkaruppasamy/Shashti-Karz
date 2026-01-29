"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
    Calendar, CheckCircle, XCircle, DollarSign, Star,
    AlertTriangle, Package, Clock, TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
    id: string;
    type: 'booking' | 'payment' | 'review' | 'completion' | 'cancellation' | 'low_stock';
    title: string;
    description: string;
    timestamp: Date;
    icon: React.ReactNode;
    color: string;
}

interface LiveActivityFeedProps {
    maxItems?: number;
}

export function LiveActivityFeed({ maxItems = 10 }: LiveActivityFeedProps) {
    const [activities, setActivities] = useState<Activity[]>([]);

    // This will be populated by real-time events
    const addActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
        const newActivity: Activity = {
            ...activity,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date()
        };

        setActivities(prev => [newActivity, ...prev].slice(0, maxItems));
    };

    // Export function for external use
    useEffect(() => {
        // @ts-ignore
        window.addAdminActivity = addActivity;
    }, []);

    const getIcon = (type: Activity['type']) => {
        switch (type) {
            case 'booking':
                return <Calendar size={16} className="text-blue-500" />;
            case 'payment':
                return <DollarSign size={16} className="text-green-500" />;
            case 'review':
                return <Star size={16} className="text-yellow-500" />;
            case 'completion':
                return <CheckCircle size={16} className="text-green-500" />;
            case 'cancellation':
                return <XCircle size={16} className="text-red-500" />;
            case 'low_stock':
                return <AlertTriangle size={16} className="text-orange-500" />;
            default:
                return <Clock size={16} className="text-gray-500" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 border border-white/5"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <TrendingUp className="text-[#ff1744]" size={20} />
                        Live Activity
                    </h3>
                    <p className="text-sm text-[#888] mt-1">Real-time updates</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold text-green-500">LIVE</span>
                </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {activities.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 text-[#888]"
                        >
                            <Clock size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-sm">Waiting for activity...</p>
                            <p className="text-xs mt-2">Events will appear here in real-time</p>
                        </motion.div>
                    ) : (
                        activities.map((activity, index) => (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: -20, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: 'auto' }}
                                exit={{ opacity: 0, x: 20, height: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-white/5"
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activity.color}`}>
                                    {getIcon(activity.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{activity.title}</div>
                                    <div className="text-xs text-[#888] mt-0.5">{activity.description}</div>
                                    <div className="text-[10px] text-[#666] mt-1">
                                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
