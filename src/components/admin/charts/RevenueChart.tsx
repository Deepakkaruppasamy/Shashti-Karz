"use client";

import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
    data: Array<{ hour: string; revenue: number }>;
    isLive?: boolean;
}

export function RevenueChart({ data, isLive = true }: RevenueChartProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 border border-white/5"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        💰 Revenue Today
                        {isLive && (
                            <span className="flex items-center gap-1.5 text-xs font-normal">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-green-500">Live</span>
                            </span>
                        )}
                    </h3>
                    <p className="text-sm text-[#888] mt-1">Hourly breakdown</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-[#d4af37]">
                        ₹{data.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-[#888]">Total Today</div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis
                        dataKey="hour"
                        stroke="#888"
                        style={{ fontSize: '12px' }}
                        tick={{ fill: '#888' }}
                    />
                    <YAxis
                        stroke="#888"
                        style={{ fontSize: '12px' }}
                        tick={{ fill: '#888' }}
                        tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '12px'
                        }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                        itemStyle={{ color: '#d4af37' }}
                        formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#d4af37"
                        strokeWidth={3}
                        fill="url(#revenueGradient)"
                        animationDuration={1000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
