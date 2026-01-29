"use client";

import { useEffect, useState } from "react";

interface FeatureRequest {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    votes: number;
    created_at: string;
    user: {
        full_name: string;
    };
}

export function FeatureVoting() {
    const [features, setFeatures] = useState<FeatureRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newFeature, setNewFeature] = useState({ title: "", description: "", category: "" });

    useEffect(() => {
        fetchFeatures();
    }, []);

    const fetchFeatures = async () => {
        try {
            const response = await fetch("/api/feedback/features");
            const data = await response.json();
            setFeatures(data.features || []);
        } catch (error) {
            console.error("Error fetching features:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/feedback/features", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newFeature),
            });

            if (response.ok) {
                setShowForm(false);
                setNewFeature({ title: "", description: "", category: "" });
                fetchFeatures();
            }
        } catch (error) {
            console.error("Error submitting feature:", error);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            submitted: "bg-gray-100 text-gray-800",
            under_review: "bg-blue-100 text-blue-800",
            planned: "bg-purple-100 text-purple-800",
            in_progress: "bg-yellow-100 text-yellow-800",
            completed: "bg-green-100 text-green-800",
            declined: "bg-red-100 text-red-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Feature Requests</h2>
                    <p className="text-gray-600">Vote for features you'd like to see</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {showForm ? "Cancel" : "➕ Request Feature"}
                </button>
            </div>

            {/* New Feature Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Request a New Feature</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Feature Title
                            </label>
                            <input
                                type="text"
                                value={newFeature.title}
                                onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={newFeature.description}
                                onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <select
                                value={newFeature.category}
                                onChange={(e) => setNewFeature({ ...newFeature, category: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select category</option>
                                <option value="booking">Booking</option>
                                <option value="payment">Payment</option>
                                <option value="service">Service</option>
                                <option value="mobile">Mobile App</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Submit Request
                        </button>
                    </div>
                </form>
            )}

            {/* Features List */}
            <div className="space-y-4">
                {features.map((feature) => (
                    <div
                        key={feature.id}
                        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                            feature.status
                                        )}`}
                                    >
                                        {feature.status.replace("_", " ")}
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-3">{feature.description}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>By {feature.user?.full_name || "Anonymous"}</span>
                                    <span>•</span>
                                    <span>{new Date(feature.created_at).toLocaleDateString()}</span>
                                    {feature.category && (
                                        <>
                                            <span>•</span>
                                            <span className="capitalize">{feature.category}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <span className="text-2xl">👍</span>
                                </button>
                                <span className="text-lg font-bold text-gray-900">{feature.votes}</span>
                                <span className="text-xs text-gray-500">votes</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {loading && <div className="text-center py-8">Loading features...</div>}

            {!loading && features.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-2">💡</div>
                    <p>No feature requests yet. Be the first to suggest one!</p>
                </div>
            )}
        </div>
    );
}
