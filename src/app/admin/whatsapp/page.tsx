"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Send, Users, Clock, CheckCheck, Plus } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface WhatsAppTemplate {
    id: string;
    name: string;
    category: string;
    language: string;
    status: string;
    content: string;
    variables_count: number;
}

interface WhatsAppStats {
    total_sent: number;
    total_delivered: number;
    total_read: number;
    total_replied: number;
    delivery_rate: number;
    read_rate: number;
    reply_rate: number;
}

export default function WhatsAppAdminPage() {
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [stats, setStats] = useState<WhatsAppStats | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    useEffect(() => {
        fetchWhatsAppData();
    }, []);

    const fetchWhatsAppData = async () => {
        try {
            // Placeholder data - replace with actual API call
            setStats({
                total_sent: 1523,
                total_delivered: 1498,
                total_read: 1342,
                total_replied: 456,
                delivery_rate: 98.4,
                read_rate: 89.6,
                reply_rate: 30.2,
            });
        } catch (error) {
            console.error("Error fetching WhatsApp data:", error);
            toast.error("Failed to load WhatsApp data");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            approved: "bg-green-500/20 text-green-400 border border-green-500/30",
            pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
            rejected: "bg-red-500/20 text-red-400 border border-red-500/30",
        };
        return colors[status] || "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#0a0a0a]">
                <AdminSidebar />
                <div className="flex-1 p-8">
                    <div className="text-center text-white">Loading WhatsApp data...</div>
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
                        <h1 className="text-3xl font-bold text-white">WhatsApp Business</h1>
                        <p className="text-[#888] mt-1">Manage templates and broadcasts</p>
                    </div>
                    <button className="px-6 py-3 bg-[#25D366] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                        <Send size={20} />
                        Send Broadcast
                    </button>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="glass-card rounded-xl p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                    <Send className="text-blue-500" size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-[#888]">Messages Sent</p>
                                    <p className="text-2xl font-bold text-white">
                                        {stats.total_sent.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card rounded-xl p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                    <CheckCheck className="text-green-500" size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-[#888]">Delivery Rate</p>
                                    <p className="text-2xl font-bold text-white">{stats.delivery_rate}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card rounded-xl p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                    <Clock className="text-purple-500" size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-[#888]">Read Rate</p>
                                    <p className="text-2xl font-bold text-white">{stats.read_rate}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card rounded-xl p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                    <MessageCircle className="text-orange-500" size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-[#888]">Reply Rate</p>
                                    <p className="text-2xl font-bold text-white">{stats.reply_rate}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Setup Instructions */}
                <div className="glass-card border-2 border-blue-500/30 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4">📱 WhatsApp Setup Required</h2>
                    <div className="space-y-3 text-sm text-[#aaa]">
                        <p>
                            <strong className="text-white">Status:</strong>{" "}
                            {process.env.WHATSAPP_ACCESS_TOKEN ? (
                                <span className="text-green-400">✅ Connected</span>
                            ) : (
                                <span className="text-red-400">❌ Not Connected</span>
                            )}
                        </p>
                        <div>
                            <p className="font-semibold text-white mb-2">To connect WhatsApp Business API:</p>
                            <ol className="list-decimal list-inside space-y-1 ml-4">
                                <li>Get WhatsApp Business API credentials from Meta</li>
                                <li>Add credentials to `.env.local` file</li>
                                <li>Configure webhook URL in Meta Dashboard</li>
                                <li>Approve message templates</li>
                            </ol>
                        </div>
                        <a
                            href="/API_KEYS_SETUP.md"
                            target="_blank"
                            className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            View Setup Guide →
                        </a>
                    </div>
                </div>

                {/* Templates Section */}
                <div className="glass-card rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Message Templates</h2>
                    <p className="text-sm text-[#888] mb-6">
                        Pre-approved templates for booking confirmations, updates, and promotions
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            {
                                name: "booking_confirmation",
                                category: "TRANSACTIONAL",
                                content: "Your booking is confirmed! Date: {{date}}, Time: {{time}}, Service: {{service}}",
                            },
                            {
                                name: "worker_assigned",
                                category: "TRANSACTIONAL",
                                content: "Worker {{worker_name}} has been assigned to your booking! ETA: {{eta}}",
                            },
                            {
                                name: "service_completed",
                                category: "TRANSACTIONAL",
                                content: "Service completed! Please rate us: {{rating_link}}",
                            },
                            {
                                name: "payment_reminder",
                                category: "TRANSACTIONAL",
                                content: "Payment pending for booking {{booking_id}}. Amount: ₹{{amount}}. Pay now: {{pay_link}}",
                            },
                        ].map((template) => (
                            <div key={template.name} className="border border-white/10 rounded-lg p-4 bg-white/5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-semibold text-white">{template.name}</p>
                                        <p className="text-xs text-[#666]">{template.category}</p>
                                    </div>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                        Ready
                                    </span>
                                </div>
                                <p className="text-sm text-[#aaa] bg-black/30 p-3 rounded border border-white/5">
                                    {template.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="glass-card border-2 border-white/10 rounded-xl p-6 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all text-left">
                        <Users className="text-blue-500 mb-3" size={32} />
                        <h3 className="font-bold text-white mb-2">Broadcast Message</h3>
                        <p className="text-sm text-[#888]">Send promotional messages to customers</p>
                    </button>

                    <button className="glass-card border-2 border-white/10 rounded-xl p-6 hover:border-green-500/50 hover:bg-green-500/10 transition-all text-left">
                        <MessageCircle className="text-green-500 mb-3" size={32} />
                        <h3 className="font-bold text-white mb-2">View Conversations</h3>
                        <p className="text-sm text-[#888]">Chat history and support messages</p>
                    </button>

                    <button className="glass-card border-2 border-white/10 rounded-xl p-6 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all text-left">
                        <Send className="text-purple-500 mb-3" size={32} />
                        <h3 className="font-bold text-white mb-2">Manage Templates</h3>
                        <p className="text-sm text-[#888]">Create and edit message templates</p>
                    </button>
                </div>
            </div>
        </div>
    );
}
