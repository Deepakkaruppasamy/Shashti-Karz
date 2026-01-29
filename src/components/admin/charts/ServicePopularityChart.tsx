"use client";

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ServicePopularityChartProps {
    data: Array<{ name: string; count: number; revenue: number }>;
}

const COLORS = ['#ff1744', '#d4af37', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export function ServicePopularityChart({ data }: ServicePopularityChartProps) {
    const total = data.reduce((sum, d) => sum + d.count, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6 border border-white/5"
        >
            <div className="mb-6">
                <h3 className="text-lg font-bold">🎯 Popular Services</h3>
                <p className="text-sm text-[#888] mt-1">Top performing services</p>
            </div>

            {data.length > 0 ? (
                <>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                innerRadius={50}
                                fill="#8884d8"
                                dataKey="count"
                                animationDuration={1000}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '12px'
                                }}
                                formatter={(value: any, name: any, props: any) => [
                                    `${value} bookings (₹${props.payload.revenue.toLocaleString()})`,
                                    props.payload.name
                                ]}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="space-y-2 mt-6">
                        {data.map((service, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                    />
                                    <span className="font-medium">{service.name}</span>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">{service.count}</div>
                                    <div className="text-xs text-[#888]">
                                        {total > 0 ? Math.round((service.count / total) * 100) : 0}%
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="text-center py-12 text-[#888]">
                    <p>No service data available</p>
                </div>
            )}
        </motion.div>
    );
}
