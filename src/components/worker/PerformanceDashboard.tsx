"use client";

import { useEffect, useState } from "react";

interface WorkerPerformance {
    worker_id: string;
    total_services: number;
    completed_services: number;
    average_rating: number;
    total_revenue: number;
    on_time_percentage: number;
    quality_score: number;
    efficiency_score: number;
    customer_satisfaction_score: number;
}

interface PerformanceDashboardProps {
    workerId: string;
}

export function PerformanceDashboard({ workerId }: PerformanceDashboardProps) {
    const [performance, setPerformance] = useState<WorkerPerformance | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPerformance();
    }, [workerId]);

    const fetchPerformance = async () => {
        try {
            const response = await fetch(`/api/workers/performance?worker_id=${workerId}`);
            const data = await response.json();
            setPerformance(data.performance);
        } catch (error) {
            console.error("Error fetching performance:", error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-green-600";
        if (score >= 75) return "text-blue-600";
        if (score >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    const getScoreBg = (score: number) => {
        if (score >= 90) return "bg-green-100";
        if (score >= 75) return "bg-blue-100";
        if (score >= 60) return "bg-yellow-100";
        return "bg-red-100";
    };

    if (loading) {
        return <div className="text-center py-8">Loading performance data...</div>;
    }

    if (!performance) {
        return <div className="text-center py-8">No performance data available</div>;
    }

    return (
        <div className="space-y-6">
            {/* Overall Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-600">Total Services</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                        {performance.total_services}
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                        {performance.completed_services}
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-600">Avg Rating</div>
                    <div className="text-2xl font-bold text-yellow-600 mt-1 flex items-center gap-1">
                        ⭐ {performance.average_rating.toFixed(1)}
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-600">Total Revenue</div>
                    <div className="text-2xl font-bold text-blue-600 mt-1">
                        ₹{performance.total_revenue.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Performance Scores */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Performance Scores</h3>
                <div className="space-y-4">
                    {/* Quality Score */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Quality Score</span>
                            <span className={`text-lg font-bold ${getScoreColor(performance.quality_score)}`}>
                                {performance.quality_score.toFixed(0)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className={`h-3 rounded-full transition-all ${getScoreBg(performance.quality_score)}`}
                                style={{ width: `${performance.quality_score}%` }}
                            />
                        </div>
                    </div>

                    {/* Efficiency Score */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Efficiency Score</span>
                            <span className={`text-lg font-bold ${getScoreColor(performance.efficiency_score)}`}>
                                {performance.efficiency_score.toFixed(0)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className={`h-3 rounded-full transition-all ${getScoreBg(performance.efficiency_score)}`}
                                style={{ width: `${performance.efficiency_score}%` }}
                            />
                        </div>
                    </div>

                    {/* Customer Satisfaction */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Customer Satisfaction</span>
                            <span
                                className={`text-lg font-bold ${getScoreColor(performance.customer_satisfaction_score)}`}
                            >
                                {performance.customer_satisfaction_score.toFixed(0)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className={`h-3 rounded-full transition-all ${getScoreBg(performance.customer_satisfaction_score)}`}
                                style={{ width: `${performance.customer_satisfaction_score}%` }}
                            />
                        </div>
                    </div>

                    {/* On-Time Percentage */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">On-Time Delivery</span>
                            <span className={`text-lg font-bold ${getScoreColor(performance.on_time_percentage)}`}>
                                {performance.on_time_percentage.toFixed(0)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className={`h-3 rounded-full transition-all ${getScoreBg(performance.on_time_percentage)}`}
                                style={{ width: `${performance.on_time_percentage}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
                <h3 className="text-lg font-semibold mb-3">💡 Performance Insights</h3>
                <ul className="space-y-2 text-sm">
                    {performance.quality_score >= 90 && (
                        <li className="flex items-center gap-2 text-green-700">
                            <span>✅</span>
                            <span>Excellent quality! Keep up the great work!</span>
                        </li>
                    )}
                    {performance.on_time_percentage >= 95 && (
                        <li className="flex items-center gap-2 text-green-700">
                            <span>✅</span>
                            <span>Outstanding punctuality!</span>
                        </li>
                    )}
                    {performance.average_rating >= 4.5 && (
                        <li className="flex items-center gap-2 text-green-700">
                            <span>✅</span>
                            <span>Customers love your service!</span>
                        </li>
                    )}
                    {performance.on_time_percentage < 85 && (
                        <li className="flex items-center gap-2 text-yellow-700">
                            <span>⚠️</span>
                            <span>Focus on improving punctuality</span>
                        </li>
                    )}
                    {performance.average_rating < 4.0 && (
                        <li className="flex items-center gap-2 text-yellow-700">
                            <span>⚠️</span>
                            <span>Customer service training recommended</span>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
