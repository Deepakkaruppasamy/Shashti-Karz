"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SupportRequest, CustomerFeedbackDinesh } from "@/lib/types";
import {
    MessageSquare,
    Mail,
    Phone,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Send,
    TrendingUp,
    Users,
    MessageCircleMore
} from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";

export default function DineshSupportPage() {
    const [activeTab, setActiveTab] = useState<"support" | "feedback">("support");
    const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
    const [feedbackList, setFeedbackList] = useState<CustomerFeedbackDinesh[]>([]);
    const [selectedSupport, setSelectedSupport] = useState<SupportRequest | null>(null);
    const [selectedFeedback, setSelectedFeedback] = useState<CustomerFeedbackDinesh | null>(null);
    const [responseText, setResponseText] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [activeTab, filterStatus]);

    const loadData = async () => {
        setLoading(true);
        const supabase = createClient();

        if (activeTab === "support") {
            let query = supabase
                .from("support_requests")
                .select("*")
                .order("created_at", { ascending: false });

            if (filterStatus !== "all") {
                query = query.eq("status", filterStatus);
            }

            const { data, error } = await query;
            if (!error && data) {
                setSupportRequests(data as SupportRequest[]);
            }
        } else {
            let query = supabase
                .from("customer_feedback_dinesh")
                .select("*")
                .order("created_at", { ascending: false });

            if (filterStatus !== "all") {
                query = query.eq("status", filterStatus);
            }

            const { data, error } = await query;
            if (!error && data) {
                setFeedbackList(data as CustomerFeedbackDinesh[]);
            }
        }
        setLoading(false);
    };

    const handleSupportResponse = async () => {
        if (!selectedSupport || !responseText.trim()) return;

        const supabase = createClient();
        const { error } = await supabase
            .from("support_requests")
            .update({
                admin_response: responseText,
                status: "resolved",
                conversation_history: [
                    ...(selectedSupport.conversation_history || []),
                    {
                        sender: "admin" as const,
                        message: responseText,
                        timestamp: new Date().toISOString(),
                    },
                ],
            })
            .eq("id", selectedSupport.id);

        if (!error) {
            setResponseText("");
            setSelectedSupport(null);
            loadData();
        }
    };

    const handleFeedbackReview = async (status: string) => {
        if (!selectedFeedback) return;

        const supabase = createClient();
        const { error } = await supabase
            .from("customer_feedback_dinesh")
            .update({
                status,
                admin_notes: adminNotes,
                reviewed_at: new Date().toISOString(),
            })
            .eq("id", selectedFeedback.id);

        if (!error) {
            setAdminNotes("");
            setSelectedFeedback(null);
            loadData();
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "pending":
            case "new":
                return <Clock className="text-yellow-500" size={20} />;
            case "in_progress":
            case "reviewed":
                return <TrendingUp className="text-blue-500" size={20} />;
            case "resolved":
            case "implemented":
                return <CheckCircle className="text-green-500" size={20} />;
            case "closed":
                return <XCircle className="text-gray-500" size={20} />;
            default:
                return <AlertCircle className="text-gray-500" size={20} />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "urgent":
                return "bg-red-500";
            case "high":
                return "bg-orange-500";
            case "medium":
                return "bg-yellow-500";
            case "low":
                return "bg-green-500";
            default:
                return "bg-gray-500";
        }
    };

    const stats = {
        totalSupport: supportRequests.length,
        pendingSupport: supportRequests.filter(s => s.status === "pending").length,
        totalFeedback: feedbackList.length,
        newFeedback: feedbackList.filter(f => f.status === "new").length,
    };

    const filteredSupport = supportRequests.filter(req =>
        req.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredFeedback = feedbackList.filter(fb =>
        fb.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
            <AdminSidebar />

            <div className="ml-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Dinesh Support Center</h1>
                    <p className="text-purple-300">Manage customer support requests and feedback</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Total Support</p>
                                <p className="text-3xl font-bold text-white mt-1">{stats.totalSupport}</p>
                            </div>
                            <MessageSquare className="text-purple-500" size={40} />
                        </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Pending</p>
                                <p className="text-3xl font-bold text-yellow-500 mt-1">{stats.pendingSupport}</p>
                            </div>
                            <Clock className="text-yellow-500" size={40} />
                        </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Total Feedback</p>
                                <p className="text-3xl font-bold text-white mt-1">{stats.totalFeedback}</p>
                            </div>
                            <MessageCircleMore className="text-blue-500" size={40} />
                        </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-sm border border-green-500/30 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">New Feedback</p>
                                <p className="text-3xl font-bold text-green-500 mt-1">{stats.newFeedback}</p>
                            </div>
                            <Users className="text-green-500" size={40} />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab("support")}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === "support"
                                ? "bg-purple-600 text-white"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                    >
                        Support Requests
                    </button>
                    <button
                        onClick={() => setActiveTab("feedback")}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === "feedback"
                                ? "bg-purple-600 text-white"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                    >
                        Customer Feedback
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 text-white pl-10 pr-4 py-3 rounded-xl border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="new">New</option>
                        <option value="reviewed">Reviewed</option>
                    </select>
                </div>

                {/* Content */}
                <div className="grid grid-cols-2 gap-6">
                    {/* List */}
                    <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 max-h-[600px] overflow-y-auto">
                        <h2 className="text-xl font-bold text-white mb-4">
                            {activeTab === "support" ? "Support Requests" : "Feedback Submissions"}
                        </h2>

                        {loading ? (
                            <div className="text-center text-slate-400 py-8">Loading...</div>
                        ) : activeTab === "support" ? (
                            <div className="space-y-4">
                                {filteredSupport.map((request) => (
                                    <div
                                        key={request.id}
                                        onClick={() => setSelectedSupport(request)}
                                        className={`p-4 rounded-lg cursor-pointer transition-all ${selectedSupport?.id === request.id
                                                ? "bg-purple-600/30 border-2 border-purple-500"
                                                : "bg-slate-800/50 border border-slate-700 hover:bg-slate-800"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(request.status)}
                                                <span className="font-semibold text-white">{request.customer_name}</span>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs text-white ${getPriorityColor(request.priority)}`}>
                                                {request.priority}
                                            </span>
                                        </div>
                                        <h3 className="text-purple-300 font-medium mb-1">{request.subject}</h3>
                                        <p className="text-slate-400 text-sm line-clamp-2">{request.message}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                            <span>{request.category}</span>
                                            <span>•</span>
                                            <span>{new Date(request.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredFeedback.map((feedback) => (
                                    <div
                                        key={feedback.id}
                                        onClick={() => setSelectedFeedback(feedback)}
                                        className={`p-4 rounded-lg cursor-pointer transition-all ${selectedFeedback?.id === feedback.id
                                                ? "bg-purple-600/30 border-2 border-purple-500"
                                                : "bg-slate-800/50 border border-slate-700 hover:bg-slate-800"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(feedback.status)}
                                                <span className="font-semibold text-white">{feedback.customer_name}</span>
                                            </div>
                                            {feedback.rating && (
                                                <span className="text-yellow-500">{"⭐".repeat(feedback.rating)}</span>
                                            )}
                                        </div>
                                        <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs mb-2">
                                            {feedback.feedback_type}
                                        </span>
                                        <p className="text-slate-400 text-sm line-clamp-2">{feedback.message}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                            {feedback.category && <span>{feedback.category}</span>}
                                            <span>•</span>
                                            <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details & Response */}
                    <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                        {selectedSupport ? (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4">Support Request Details</h2>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="text-slate-400 text-sm">Customer</label>
                                        <p className="text-white font-medium">{selectedSupport.customer_name}</p>
                                    </div>

                                    {selectedSupport.customer_email && (
                                        <div className="flex items-center gap-2">
                                            <Mail size={16} className="text-purple-400" />
                                            <span className="text-slate-300">{selectedSupport.customer_email}</span>
                                        </div>
                                    )}

                                    {selectedSupport.customer_phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone size={16} className="text-purple-400" />
                                            <span className="text-slate-300">{selectedSupport.customer_phone}</span>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-slate-400 text-sm">Subject</label>
                                        <p className="text-white font-medium">{selectedSupport.subject}</p>
                                    </div>

                                    <div>
                                        <label className="text-slate-400 text-sm">Message</label>
                                        <p className="text-slate-300">{selectedSupport.message}</p>
                                    </div>

                                    <div className="flex gap-4">
                                        <div>
                                            <label className="text-slate-400 text-sm">Status</label>
                                            <p className="text-white capitalize">{selectedSupport.status}</p>
                                        </div>
                                        <div>
                                            <label className="text-slate-400 text-sm">Priority</label>
                                            <p className="text-white capitalize">{selectedSupport.priority}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-white font-medium mb-2 block">Admin Response</label>
                                    <textarea
                                        value={responseText}
                                        onChange={(e) => setResponseText(e.target.value)}
                                        placeholder="Type your response..."
                                        className="w-full bg-slate-800 text-white p-4 rounded-xl border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[150px]"
                                    />
                                    <button
                                        onClick={handleSupportResponse}
                                        className="mt-4 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                                    >
                                        <Send size={20} />
                                        Send Response & Mark Resolved
                                    </button>
                                </div>
                            </div>
                        ) : selectedFeedback ? (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4">Feedback Details</h2>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="text-slate-400 text-sm">Customer</label>
                                        <p className="text-white font-medium">{selectedFeedback.customer_name}</p>
                                    </div>

                                    <div>
                                        <label className="text-slate-400 text-sm">Type</label>
                                        <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg capitalize">
                                            {selectedFeedback.feedback_type.replace("_", " ")}
                                        </span>
                                    </div>

                                    {selectedFeedback.rating && (
                                        <div>
                                            <label className="text-slate-400 text-sm">Rating</label>
                                            <p className="text-yellow-500 text-2xl">{"⭐".repeat(selectedFeedback.rating)}</p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-slate-400 text-sm">Feedback</label>
                                        <p className="text-slate-300">{selectedFeedback.message}</p>
                                    </div>

                                    {selectedFeedback.satisfaction_score && (
                                        <div>
                                            <label className="text-slate-400 text-sm">Satisfaction Score</label>
                                            <p className="text-white font-bold text-2xl">{selectedFeedback.satisfaction_score}/10</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-white font-medium mb-2 block">Admin Notes</label>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Add internal notes..."
                                        className="w-full bg-slate-800 text-white p-4 rounded-xl border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                                    />
                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                        <button
                                            onClick={() => handleFeedbackReview("reviewed")}
                                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
                                        >
                                            Reviewed
                                        </button>
                                        <button
                                            onClick={() => handleFeedbackReview("acknowledged")}
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-medium"
                                        >
                                            Acknowledged
                                        </button>
                                        <button
                                            onClick={() => handleFeedbackReview("implemented")}
                                            className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
                                        >
                                            Implemented
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                Select an item to view details
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
