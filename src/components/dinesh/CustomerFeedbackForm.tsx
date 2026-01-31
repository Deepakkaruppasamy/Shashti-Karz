"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, Send, Star } from "lucide-react";

interface FeedbackFormProps {
    userName?: string;
    userEmail?: string;
    onSuccess?: () => void;
}

export function CustomerFeedbackForm({ userName, userEmail, onSuccess }: FeedbackFormProps) {
    const [formData, setFormData] = useState({
        customer_name: userName || "",
        customer_email: userEmail || "",
        feedback_type: "suggestion",
        category: "website",
        rating: 5,
        message: "",
        satisfaction_score: 8,
        would_recommend: true,
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Failed to submit feedback");

            // Trigger Email Notification
            if (formData.customer_email) {
                try {
                    await fetch("/api/notifications/email", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            to: formData.customer_email,
                            subject: `Shashti Karz - Thank you for your feedback!`,
                            type: "feedback_confirmation",
                            data: {
                                customerName: formData.customer_name,
                                feedbackType: formData.feedback_type,
                                rating: formData.rating,
                                message: formData.message
                            }
                        }),
                    });
                } catch (notiErr) {
                    console.error("Failed to send notification:", notiErr);
                }
            }

            setSuccess(true);
            setFormData({
                customer_name: userName || "",
                customer_email: userEmail || "",
                feedback_type: "suggestion",
                category: "website",
                rating: 5,
                message: "",
                satisfaction_score: 8,
                would_recommend: true,
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
                    <p>Thank you for your feedback! We appreciate your input.</p>
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

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-white font-medium mb-2 block">Feedback Type *</label>
                    <select
                        required
                        value={formData.feedback_type}
                        onChange={(e) => setFormData({ ...formData, feedback_type: e.target.value })}
                        className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="suggestion">Suggestion</option>
                        <option value="compliment">Compliment</option>
                        <option value="complaint">Complaint</option>
                        <option value="feature_request">Feature Request</option>
                        <option value="bug_report">Bug Report</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="text-white font-medium mb-2 block">Category</label>
                    <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="website">Website</option>
                        <option value="booking">Booking</option>
                        <option value="service">Service</option>
                        <option value="payment">Payment</option>
                        <option value="communication">Communication</option>
                        <option value="voice_assistant">Voice Assistant (Dinesh)</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="text-white font-medium mb-2 block">Overall Rating</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setFormData({ ...formData, rating: star })}
                            className="transition-transform hover:scale-110"
                        >
                            <Star
                                size={32}
                                className={star <= formData.rating ? "fill-yellow-500 text-yellow-500" : "text-slate-600"}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-white font-medium mb-2 block">
                    Satisfaction Score (1-10)
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.satisfaction_score}
                        onChange={(e) => setFormData({ ...formData, satisfaction_score: parseInt(e.target.value) })}
                        className="flex-1"
                    />
                    <span className="text-2xl font-bold text-purple-400 w-12 text-center">
                        {formData.satisfaction_score}
                    </span>
                </div>
            </div>

            <div>
                <label className="text-white font-medium mb-2 block">Your Feedback *</label>
                <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[150px]"
                    placeholder="Please share your thoughts, suggestions, or concerns..."
                />
            </div>

            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    id="recommend"
                    checked={formData.would_recommend}
                    onChange={(e) => setFormData({ ...formData, would_recommend: e.target.checked })}
                    className="w-5 h-5 rounded border-purple-500/30 bg-slate-800 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                <label htmlFor="recommend" className="text-white">
                    I would recommend Shashti Karz to others
                </label>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
            >
                <Send size={20} />
                {loading ? "Submitting..." : "Submit Feedback"}
            </button>
        </form>
    );
}
