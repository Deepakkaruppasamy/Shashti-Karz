"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, Send } from "lucide-react";

interface SupportFormProps {
    userName?: string;
    userEmail?: string;
    onSuccess?: () => void;
}

export function SupportRequestForm({ userName, userEmail, onSuccess }: SupportFormProps) {
    const [formData, setFormData] = useState({
        customer_name: userName || "",
        customer_email: userEmail || "",
        customer_phone: "",
        category: "general",
        subject: "",
        message: "",
        priority: "medium",
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Failed to submit support request");
            const requestData = await response.json();

            // Trigger Email Notification
            if (formData.customer_email) {
                try {
                    await fetch("/api/notifications/email", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            to: formData.customer_email,
                            subject: `Support Request Received - #${requestData.id?.substring(0, 8) || "ORCH-" + Math.floor(Math.random() * 1000)}`,
                            type: "support_request",
                            data: {
                                customerName: formData.customer_name,
                                requestId: requestData.id?.substring(0, 8) || "ORCH-" + Math.floor(Math.random() * 1000),
                                subject: formData.subject,
                                category: formData.category,
                                priority: formData.priority,
                                message: formData.message
                            }
                        }),
                    });
                } catch (notiErr) {
                    console.error("Failed to send notification:", notiErr);
                    // Don't fail the whole submission if notification fails
                }
            }

            setSuccess(true);
            setFormData({
                customer_name: userName || "",
                customer_email: userEmail || "",
                customer_phone: "",
                category: "general",
                subject: "",
                message: "",
                priority: "medium",
            });

            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
                <div className="bg-green-500/20 border border-green-500 text-green-300 p-4 rounded-xl flex items-center gap-2">
                    <CheckCircle size={20} />
                    <p>Your support request has been submitted successfully! We'll get back to you soon.</p>
                </div>
            )}

            {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-xl flex items-center gap-2">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}

            <div>
                <label className="text-white font-medium mb-2 block">Name *</label>
                <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Your name"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-white font-medium mb-2 block">Email</label>
                    <input
                        type="email"
                        value={formData.customer_email}
                        onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                        className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="your@email.com"
                    />
                </div>

                <div>
                    <label className="text-white font-medium mb-2 block">Phone</label>
                    <input
                        type="tel"
                        value={formData.customer_phone}
                        onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                        className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="+1 234 567 8900"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-white font-medium mb-2 block">Category *</label>
                    <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="general">General</option>
                        <option value="navigation">Navigation Help</option>
                        <option value="service_info">Service Information</option>
                        <option value="booking_help">Booking Help</option>
                        <option value="technical">Technical Issue</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="text-white font-medium mb-2 block">Priority</label>
                    <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="text-white font-medium mb-2 block">Subject *</label>
                <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Brief summary of your issue"
                />
            </div>

            <div>
                <label className="text-white font-medium mb-2 block">Message *</label>
                <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[150px]"
                    placeholder="Please describe your issue or question in detail..."
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
            >
                <Send size={20} />
                {loading ? "Submitting..." : "Submit Support Request"}
            </button>
        </form>
    );
}
