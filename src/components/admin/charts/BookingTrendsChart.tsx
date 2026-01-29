"use client";

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BookingTrendsChartProps {
    data: {
        pending: number;
        completed: number;
        cancelled: number;
    };
}

export function BookingTrendsChart({ data }: BookingTrendsChartProps) {
    const chartData = [
        { name: 'Pending', value: data.pending, fill: '#f59e0b' },
        { name: 'Completed', value: data.completed, fill: '#10b981' },
        { name: 'Cancelled', value: data.cancelled, fill: '#ef4444' }
    ];

    const total = data.pending + data.completed + data.cancelled;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6 border border-white/5"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold">📊 Booking Status</h3>
                    <p className="text-sm text-[#888] mt-1">Current distribution</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold">{total}</div>
                    <div className="text-xs text-[#888]">Total Bookings</div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis
                        dataKey="name"
                        stroke="#888"
                        style={{ fontSize: '12px' }}
                        tick={{ fill: '#888' }}
                    />
                    <YAxis
                        stroke="#888"
                        style={{ fontSize: '12px' }}
                        tick={{ fill: '#888' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '12px'
                        }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    />
                    <Bar
                        dataKey="value"
                        radius={[8, 8, 0, 0]}
                        animationDuration={1000}
                    >
                        {chartData.map((entry, index) => (
                            <motion.rect
                                key={`bar-${index}`}
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                fill={entry.fill}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-3 gap-4 mt-6">
                {chartData.map((item, i) => (
                    <div key={i} className="text-center">
                        <div className="text-lg font-bold" style={{ color: item.fill }}>
                            {item.value}
                        </div>
                        <div className="text-xs text-[#888]">{item.name}</div>
                        <div className="text-xs text-[#666]">
                            {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
