"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Users, AlertTriangle, Crown, DollarSign } from "lucide-react";

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
            const data = await response.json();

            setCustomers(data.customers || []);
            setSegments(data.segments || []);
        } catch (error) {
            console.error("Error fetching LTV data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getSegmentColor = (segment: string) => {
        const colors: Record<string, string> = {
            "high_value": "bg-purple-100 text-purple-800 border-purple-300",
            "growing": "bg-green-100 text-green-800 border-green-300",
            "at_risk": "bg-orange-100 text-orange-800 border-orange-300",
            "churned": "bg-red-100 text-red-800 border-red-300",
            "new": "bg-blue-100 text-blue-800 border-blue-300",
        };
        return colors[segment] || "bg-gray-100 text-gray-800 border-gray-300";
    };

    const getChurnRiskColor = (level: string) => {
        const colors: Record<string, string> = {
            "low": "text-green-600",
            "medium": "text-yellow-600",
            "high": "text-orange-600",
            "critical": "text-red-600",
        };
        return colors[level] || "text-gray-600";
    };

    if (loading) {
        return <div className="p-8 text-center">Loading LTV data...</div>;
    }

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Customer Lifetime Value</h1>
                <p className="text-gray-600 mt-1">Analyze and predict customer value</p>
            </div>

            {/* Segment Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {segments.map((segment) => (
                    <button
                        key={segment.segment_name}
                        onClick={() => setSelectedSegment(segment.segment_name)}
                        className={`bg-white rounded-xl border-2 p-4 text-left transition-all hover:shadow-lg ${selectedSegment === segment.segment_name
                                ? getSegmentColor(segment.segment_name)
                                : "border-gray-200"
                            }`}
                    >
                        <p className="text-sm font-medium capitalize mb-1">
                            {segment.segment_name.replace("_", " ")}
                        </p>
                        <p className="text-2xl font-bold">{segment.customer_count}</p>
                        <p className="text-xs text-gray-600 mt-2">
                            Avg LTV: ₹{segment.avg_ltv?.toLocaleString() || 0}
                        </p>
                    </button>
                ))}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total LTV</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ₹{customers.reduce((sum, c) => sum + c.actual_ltv, 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Avg LTV</p>
                            <p className="text-2xl font-bold text-gray-900">
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

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Crown className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">VIP Customers</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {customers.filter((c) => c.is_vip).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="text-red-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">At Risk</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {customers.filter((c) => c.churn_risk_level === "high" || c.churn_risk_level === "critical").length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Customer
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Segment
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                LTV
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Total Spent
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Bookings
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Churn Risk
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Tier
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {customers.map((customer) => (
                            <tr key={customer.user_id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {customer.is_vip && <Crown size={16} className="text-yellow-500" />}
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {customer.user?.full_name || "Unknown"}
                                            </p>
                                            <p className="text-sm text-gray-600">{customer.user?.email}</p>
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
                                    <p className="text-sm font-semibold text-gray-900">
                                        ₹{customer.actual_ltv.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Predicted: ₹{customer.predicted_ltv.toLocaleString()}
                                    </p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-gray-900">₹{customer.total_spent.toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-gray-900">{customer.total_bookings}</p>
                                    <p className="text-xs text-gray-500">
                                        Avg: ₹{customer.average_booking_value.toLocaleString()}
                                    </p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className={`text-sm font-semibold ${getChurnRiskColor(customer.churn_risk_level)}`}>
                                        {customer.churn_risk_level.toUpperCase()}
                                    </p>
                                    <p className="text-xs text-gray-500">{customer.churn_risk_score.toFixed(2)}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm capitalize text-gray-700">{customer.loyalty_tier}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {customers.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Users size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>No customers in this segment</p>
                    </div>
                )}
            </div>
        </div>
    );
}
