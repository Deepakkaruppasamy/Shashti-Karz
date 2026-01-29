'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Users, Clock } from 'lucide-react';
import { useOnlineUsers } from '@/hooks/useRealtimeSubscription';
import { formatDistanceToNow } from 'date-fns';

interface RealtimeIndicatorProps {
    isConnected: boolean;
    lastUpdate?: Date | null;
    showOnlineUsers?: boolean;
}

export function RealtimeIndicator({
    isConnected,
    lastUpdate,
    showOnlineUsers = true
}: RealtimeIndicatorProps) {
    const { onlineCount } = useOnlineUsers();

    return (
        <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
                <motion.div
                    animate={{
                        scale: isConnected ? [1, 1.2, 1] : 1,
                        opacity: isConnected ? 1 : 0.5
                    }}
                    transition={{
                        repeat: isConnected ? Infinity : 0,
                        duration: 2,
                        ease: "easeInOut"
                    }}
                >
                    {isConnected ? (
                        <Wifi size={16} className="text-green-500" />
                    ) : (
                        <WifiOff size={16} className="text-red-500" />
                    )}
                </motion.div>

                <AnimatePresence mode="wait">
                    <motion.span
                        key={isConnected ? 'connected' : 'disconnected'}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`text-sm font-medium ${isConnected ? 'text-green-500' : 'text-red-500'
                            }`}
                    >
                        {isConnected ? 'Live' : 'Offline'}
                    </motion.span>
                </AnimatePresence>
            </div>

            {/* Online Users Count */}
            {showOnlineUsers && isConnected && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10"
                >
                    <Users size={14} className="text-[#d4af37]" />
                    <span className="text-sm text-white font-medium">{onlineCount}</span>
                    <span className="text-xs text-[#888]">online</span>
                </motion.div>
            )}

            {/* Last Update Time */}
            {lastUpdate && isConnected && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1.5 text-xs text-[#666]"
                >
                    <Clock size={12} />
                    <span>
                        Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}
                    </span>
                </motion.div>
            )}
        </div>
    );
}

// Pulsing Live Badge
export function LiveBadge() {
    return (
        <div className="flex items-center gap-2">
            <motion.div
                className="w-2 h-2 rounded-full bg-green-500"
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <span className="text-xs font-semibold text-green-500 uppercase tracking-wide">
                Live
            </span>
        </div>
    );
}
