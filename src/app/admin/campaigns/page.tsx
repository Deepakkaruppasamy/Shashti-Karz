"use client";

import { useState, useEffect } from "react";
import { Send, Users, Calendar, TrendingUp, Eye, Plus } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

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
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user) {
            fetchCampaigns();
        }
    }, [user]);

    const fetchCampaigns = async () => {
        try {
            const response = await fetch("/api/campaigns");

            if (response.status === 401) {
                toast.error("Please login to access this page");
                router.push("/login");
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to fetch campaigns");
            }

            const data = await response.json();
            setCampaigns(data.campaigns || []);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
            toast.error("Failed to load campaigns");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
            scheduled: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
            active: "bg-green-500/20 text-green-400 border border-green-500/30",
            paused: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
            completed: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
        };
        return colors[status] || "bg-gray-500/20 text-gray-400 border border-gray-500/30";
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
        return (
            <div className="flex min-h-screen bg-[#0a0a0a]">
                <AdminSidebar />
                <div className="flex-1 p-8">
                    <div className="text-center text-white">Loading campaigns...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0a0a0a]">
            <AdminSidebar />
            <div className="flex-1 p-8 space-y-6 overflow-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Marketing Campaigns</h1>
                        <p className="text-[#888] mt-1">Automated customer engagement</p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="px-6 py-3 bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Create Campaign
                    </button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass-card rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <Send className="text-blue-500" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[#888]">Total Campaigns</p>
                                <p className="text-2xl font-bold text-white">{campaigns.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <Users className="text-green-500" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[#888]">Total Sent</p>
                                <p className="text-2xl font-bold text-white">
                                    {campaigns.reduce((sum, c) => sum + c.sent_count, 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <Eye className="text-purple-500" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[#888]">Avg Open Rate</p>
                                <p className="text-2xl font-bold text-white">
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

                    <div className="glass-card rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                <TrendingUp className="text-orange-500" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[#888]">Conversions</p>
                                <p className="text-2xl font-bold text-white">
                                    {campaigns.reduce((sum, c) => sum + c.converted_count, 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Campaigns List */}
                <div className="glass-card rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Campaign
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Type
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Recipients
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Open Rate
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Conversions
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Created
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {campaigns.map((campaign) => (
                                    <tr key={campaign.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-white">{campaign.name}</p>
                                                <p className="text-sm text-[#aaa] capitalize">
                                                    {campaign.trigger_type.replace(/_/g, " ")}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-[#aaa] capitalize">
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
                                            <p className="text-sm text-white">{campaign.sent_count.toLocaleString()}</p>
                                            <p className="text-xs text-[#666]">
                                                of {campaign.total_recipients.toLocaleString()}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500"
                                                        style={{ width: `${calculateOpenRate(campaign)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium text-white">
                                                    {calculateOpenRate(campaign)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-green-400">
                                                {campaign.converted_count}
                                            </p>
                                            <p className="text-xs text-[#666]">
                                                {calculateConversionRate(campaign)}% rate
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-[#aaa]">
                                                {new Date(campaign.created_at).toLocaleDateString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {campaigns.length === 0 && (
                            <div className="text-center py-12 text-[#666]">
                                <Send size={48} className="mx-auto mb-4 text-[#333]" />
                                <p>No campaigns yet. Create your first campaign!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
