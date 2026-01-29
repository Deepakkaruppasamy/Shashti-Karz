"use client";

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AnimatedMetricCardProps {
    title: string;
    value: number;
    prefix?: string;
    suffix?: string;
    icon: React.ReactNode;
    gradient: string;
    trend?: number;
    trendLabel?: string;
    isLive?: boolean;
    decimals?: number;
}

export function AnimatedMetricCard({
    title,
    value,
    prefix = '',
    suffix = '',
    icon,
    gradient,
    trend,
    trendLabel,
    isLive = false,
    decimals = 0
}: AnimatedMetricCardProps) {
    const spring = useSpring(0, { stiffness: 100, damping: 30 });
    const display = useTransform(spring, (current) =>
        decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString()
    );

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    const trendColor = trend && trend > 0 ? 'text-green-500' : trend && trend < 0 ? 'text-red-500' : 'text-[#888]';
    const TrendIcon = trend && trend > 0 ? TrendingUp : TrendingDown;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden"
        >
            {/* Background gradient effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        {icon}
                    </div>
                    {isLive && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-green-500 uppercase">Live</span>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="text-sm font-medium text-[#888] uppercase tracking-wider">
                        {title}
                    </div>
                    <motion.div
                        className="text-3xl font-bold"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 0.3 }}
                        key={value}
                    >
                        {prefix}
                        <motion.span>{display}</motion.span>
                        {suffix}
                    </motion.div>

                    {trend !== undefined && (
                        <div className={`flex items-center gap-2 text-sm ${trendColor}`}>
                            <TrendIcon size={16} />
                            <span className="font-bold">
                                {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                            </span>
                            {trendLabel && (
                                <span className="text-[#888] text-xs">vs {trendLabel}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
