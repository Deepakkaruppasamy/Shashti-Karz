"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Users, AlertTriangle, Crown, DollarSign } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Customer {
    user_id: string;
    total_bookings: number;
    total_spent: number;
    average_booking_value: number;
    booking_frequency: number;
    predicted_ltv: number;
    actual_ltv: number;
    customer_segment: string;
    churn_risk_score: number;
    churn_risk_level: string;
    is_vip: boolean;
    loyalty_tier: string;
    user: {
        full_name: string;
        email: string;
    };
}

interface Segment {
    segment_name: string;
    customer_count: number;
    avg_ltv: number;
    total_revenue: number;
    description: string;
}

export default function LTVAdminPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [selectedSegment, setSelectedSegment] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    useEffect(() => {
        fetchLTVData();
    }, [selectedSegment]);

    const fetchLTVData = async () => {
        try {
            const params = new URLSearchParams();
            if (selectedSegment !== "all") {
                params.append("segment", selectedSegment);
            }

            const response = await fetch(`/api/customers/ltv?${params}`);



            if (!response.ok) {
                throw new Error("Failed to fetch LTV data");
            }

            const data = await response.json();

            setCustomers(data.customers || []);
            setSegments(data.segments || []);
        } catch (error) {
            console.error("Error fetching LTV data:", error);
            toast.error("Failed to load LTV data");
        } finally {
            setLoading(false);
        }
    };

    const getSegmentColor = (segment: string) => {
        const colors: Record<string, string> = {
            "high_value": "bg-purple-500/20 text-purple-400 border-purple-500/30",
            "growing": "bg-green-500/20 text-green-400 border-green-500/30",
            "at_risk": "bg-orange-500/20 text-orange-400 border-orange-500/30",
            "churned": "bg-red-500/20 text-red-400 border-red-500/30",
            "new": "bg-blue-500/20 text-blue-400 border-blue-500/30",
        };
        return colors[segment] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
    };

    const getChurnRiskColor = (level: string) => {
        const colors: Record<string, string> = {
            "low": "text-green-400",
            "medium": "text-yellow-400",
            "high": "text-orange-400",
            "critical": "text-red-400",
        };
        return colors[level] || "text-gray-400";
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#0a0a0a]">
                <AdminSidebar />
                <div className="flex-1 p-8">
                    <div className="text-center text-white">Loading LTV data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0a0a0a]">
            <AdminSidebar />
            <div className="flex-1 p-8 space-y-6 overflow-auto">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white">Customer Lifetime Value</h1>
                    <p className="text-[#888] mt-1">Analyze and predict customer value</p>
                </div>

                {/* Segment Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {segments.map((segment) => (
                        <button
                            key={segment.segment_name}
                            onClick={() => setSelectedSegment(segment.segment_name)}
                            className={`glass-card rounded-xl border-2 p-4 text-left transition-all hover:shadow-lg ${selectedSegment === segment.segment_name
                                ? getSegmentColor(segment.segment_name)
                                : "border-white/10"
                                }`}
                        >
                            <p className="text-sm font-medium capitalize mb-1 text-white">
                                {segment.segment_name.replace("_", " ")}
                            </p>
                            <p className="text-2xl font-bold text-white">{segment.customer_count}</p>
                            <p className="text-xs text-[#666] mt-2">
                                Avg LTV: ₹{segment.avg_ltv?.toLocaleString() || 0}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass-card rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <TrendingUp className="text-purple-500" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[#888]">Total LTV</p>
                                <p className="text-2xl font-bold text-white">
                                    ₹{customers.reduce((sum, c) => sum + c.actual_ltv, 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <DollarSign className="text-green-500" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[#888]">Avg LTV</p>
                                <p className="text-2xl font-bold text-white">
                                    ₹
                                    {customers.length > 0
                                        ? Math.round(
                                            customers.reduce((sum, c) => sum + c.actual_ltv, 0) / customers.length
                                        ).toLocaleString()
                                        : 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <Crown className="text-blue-500" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[#888]">VIP Customers</p>
                                <p className="text-2xl font-bold text-white">
                                    {customers.filter((c) => c.is_vip).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="text-red-500" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[#888]">At Risk</p>
                                <p className="text-2xl font-bold text-white">
                                    {customers.filter((c) => c.churn_risk_level === "high" || c.churn_risk_level === "critical").length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customers Table */}
                <div className="glass-card rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Customer
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Segment
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        LTV
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Total Spent
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Bookings
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Churn Risk
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Tier
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {customers.map((customer) => (
                                    <tr key={customer.user_id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {customer.is_vip && <Crown size={16} className="text-yellow-500" />}
                                                <div>
                                                    <p className="font-semibold text-white">
                                                        {customer.user?.full_name || "Unknown"}
                                                    </p>
                                                    <p className="text-sm text-[#aaa]">{customer.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getSegmentColor(
                                                    customer.customer_segment
                                                )}`}
                                            >
                                                {customer.customer_segment.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-white">
                                                ₹{customer.actual_ltv.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-[#666]">
                                                Predicted: ₹{customer.predicted_ltv.toLocaleString()}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-white">₹{customer.total_spent.toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-white">{customer.total_bookings}</p>
                                            <p className="text-xs text-[#666]">
                                                Avg: ₹{customer.average_booking_value.toLocaleString()}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className={`text-sm font-semibold ${getChurnRiskColor(customer.churn_risk_level)}`}>
                                                {customer.churn_risk_level.toUpperCase()}
                                            </p>
                                            <p className="text-xs text-[#666]">{customer.churn_risk_score.toFixed(2)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm capitalize text-[#aaa]">{customer.loyalty_tier}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {customers.length === 0 && (
                            <div className="text-center py-12 text-[#666]">
                                <Users size={48} className="mx-auto mb-4 text-[#333]" />
                                <p>No customers in this segment</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
