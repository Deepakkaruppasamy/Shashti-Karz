"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Send, Users, Clock, CheckCheck } from "lucide-react";

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

    useEffect(() => {
        fetchWhatsAppData();
    }, []);

    const fetchWhatsAppData = async () => {
        try {
            // Note: This would fetch from your API
            // For now using placeholder data
            setStats({
                total_sent: 1523,
                total_delivered: 1498,
                total_read: 1342,
                total_replied: 456,
                delivery_rate: 98.4,
                read_rate: 89.6,
                reply_rate: 30.2,
            });

            // Fetch templates from database
            // const response = await fetch("/api/whatsapp/templates");
            // const data = await response.json();
            // setTemplates(data.templates || []);
        } catch (error) {
            console.error("Error fetching WhatsApp data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            approved: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            rejected: "bg-red-100 text-red-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    if (loading) {
        return <div className="p-8 text-center">Loading WhatsApp data...</div>;
    }

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">WhatsApp Business</h1>
                    <p className="text-gray-600 mt-1">Manage templates and broadcasts</p>
                </div>
                <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                    <Send size={20} />
                    Send Broadcast
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Send className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Messages Sent</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.total_sent.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCheck className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Delivery Rate</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.delivery_rate}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Clock className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Read Rate</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.read_rate}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <MessageCircle className="text-orange-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Reply Rate</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.reply_rate}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Setup Instructions */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-blue-900 mb-4">📱 WhatsApp Setup Required</h2>
                <div className="space-y-3 text-sm text-blue-800">
                    <p>
                        <strong>Status:</strong>{" "}
                        {process.env.WHATSAPP_ACCESS_TOKEN ? (
                            <span className="text-green-600">✅ Connected</span>
                        ) : (
                            <span className="text-red-600">❌ Not Connected</span>
                        )}
                    </p>
                    <div>
                        <p className="font-semibold mb-2">To connect WhatsApp Business API:</p>
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
                        className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        View Setup Guide →
                    </a>
                </div>
            </div>

            {/* Templates Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Message Templates</h2>
                <p className="text-sm text-gray-600 mb-6">
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
                        <div key={template.name} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="font-semibold text-gray-900">{template.name}</p>
                                    <p className="text-xs text-gray-500">{template.category}</p>
                                </div>
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Ready
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                                {template.content}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50 transition-all text-left">
                    <Users className="text-blue-600 mb-3" size={32} />
                    <h3 className="font-bold text-gray-900 mb-2">Broadcast Message</h3>
                    <p className="text-sm text-gray-600">Send promotional messages to customers</p>
                </button>

                <button className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-green-400 hover:bg-green-50 transition-all text-left">
                    <MessageCircle className="text-green-600 mb-3" size={32} />
                    <h3 className="font-bold text-gray-900 mb-2">View Conversations</h3>
                    <p className="text-sm text-gray-600">Chat history and support messages</p>
                </button>

                <button className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-400 hover:bg-purple-50 transition-all text-left">
                    <Send className="text-purple-600 mb-3" size={32} />
                    <h3 className="font-bold text-gray-900 mb-2">Manage Templates</h3>
                    <p className="text-sm text-gray-600">Create and edit message templates</p>
                </button>
            </div>
        </div>
    );
}
