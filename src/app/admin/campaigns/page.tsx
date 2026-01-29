"use client";

import { useState, useEffect } from "react";
import { Send, Users, Calendar, TrendingUp, Eye } from "lucide-react";

interface Campaign {
    id: string;
    name: string;
    campaign_type: string;
    trigger_type: string;
    status: string;
    total_recipients: number;
    sent_count: number;
    opened_count: number;
    clicked_count: number;
    converted_count: number;
    created_at: string;
}

export default function CampaignsAdminPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const response = await fetch("/api/campaigns");
            const data = await response.json();
            setCampaigns(data.campaigns || []);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: "bg-gray-100 text-gray-800",
            scheduled: "bg-blue-100 text-blue-800",
            active: "bg-green-100 text-green-800",
            paused: "bg-yellow-100 text-yellow-800",
            completed: "bg-purple-100 text-purple-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const calculateOpenRate = (campaign: Campaign) => {
        if (campaign.sent_count === 0) return 0;
        return Math.round((campaign.opened_count / campaign.sent_count) * 100);
    };

    const calculateClickRate = (campaign: Campaign) => {
        if (campaign.opened_count === 0) return 0;
        return Math.round((campaign.clicked_count / campaign.opened_count) * 100);
    };

    const calculateConversionRate = (campaign: Campaign) => {
        if (campaign.sent_count === 0) return 0;
        return Math.round((campaign.converted_count / campaign.sent_count) * 100);
    };

    if (loading) {
        return <div className="p-8 text-center">Loading campaigns...</div>;
    }

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Marketing Campaigns</h1>
                    <p className="text-gray-600 mt-1">Automated customer engagement</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Send size={20} />
                    Create Campaign
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Send className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Campaigns</p>
                            <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Users className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Sent</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {campaigns.reduce((sum, c) => sum + c.sent_count, 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Eye className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Avg Open Rate</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {campaigns.length > 0
                                    ? Math.round(
                                        campaigns.reduce((sum, c) => sum + calculateOpenRate(c), 0) /
                                        campaigns.length
                                    )
                                    : 0}
                                %
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="text-orange-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Conversions</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {campaigns.reduce((sum, c) => sum + c.converted_count, 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Campaigns List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Campaign
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Type
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Recipients
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Open Rate
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Conversions
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Created
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {campaigns.map((campaign) => (
                            <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-semibold text-gray-900">{campaign.name}</p>
                                        <p className="text-sm text-gray-600 capitalize">
                                            {campaign.trigger_type.replace(/_/g, " ")}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-700 capitalize">
                                        {campaign.campaign_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                            campaign.status
                                        )}`}
                                    >
                                        {campaign.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-gray-900">{campaign.sent_count.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">
                                        of {campaign.total_recipients.toLocaleString()}
                                    </p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600"
                                                style={{ width: `${calculateOpenRate(campaign)}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {calculateOpenRate(campaign)}%
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-semibold text-green-600">
                                        {campaign.converted_count}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {calculateConversionRate(campaign)}% rate
                                    </p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-700">
                                        {new Date(campaign.created_at).toLocaleDateString()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {campaigns.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Send size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>No campaigns yet. Create your first campaign!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
