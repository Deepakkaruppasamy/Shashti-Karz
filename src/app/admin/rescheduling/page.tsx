"use client";

import { useState, useEffect } from "react";
import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Search,
    Filter,
    MoreHorizontal,
    ArrowRight,
    Sun,
    CloudRain,
    Wind,
    RefreshCw,
    ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { BrandedLoader } from "@/components/animations/BrandedLoader";
import { format } from "date-fns";

interface RescheduleRequest {
    id: string;
    booking_id: string;
    user_id: string;
    original_date: string;
    original_time: string;
    requested_date: string;
    requested_time: string;
    reason: string;
    reason_details: string;
    status: "pending" | "approved" | "rejected" | "auto_approved";
    suggested_slots: any[];
    created_at: string;
    user: {
        full_name: string;
        email: string;
        phone: string;
    };
    booking: {
        service: {
            name: string;
        };
        car_model: string;
    };
}

export default function ReschedulingAdminPage() {
    const [requests, setRequests] = useState<RescheduleRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
    const [selectedRequest, setSelectedRequest] = useState<RescheduleRequest | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchRequests();

        // Subscribe to realtime changes
        const channel = supabase
            .channel('reschedule_requests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reschedule_requests' }, () => {
                fetchRequests();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchRequests = async () => {
        try {
            // Note: We're doing a join here manually or assuming the view returns this structure
            // For now, let's fetch requests and then fetch related data if needed
            // Or rely on a Supabase query with foreign keys
            const { data, error } = await supabase
                .from('reschedule_requests')
                .select(`
          *,
          user:profiles!reschedule_requests_user_id_fkey(full_name, email, phone),
          booking:bookings(car_model, service:services(name))
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data as any || []);
        } catch (error) {
            console.error('Error fetching reschedule requests:', error);
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        setIsProcessing(true);
        try {
            if (action === 'approve') {
                const req = requests.find(r => r.id === id);
                if (!req) return;

                // 1. Update request status
                const { error: reqError } = await supabase
                    .from('reschedule_requests')
                    .update({
                        status: 'approved',
                        approved_at: new Date().toISOString(),
                        approved_date: req.requested_date,
                        approved_time: req.requested_time
                    })
                    .eq('id', id);

                if (reqError) throw reqError;

                // 2. Update actual booking
                const { error: bookingError } = await supabase
                    .from('bookings')
                    .update({
                        date: req.requested_date,
                        time: req.requested_time,
                        status: 'approved' // Reset status to approved if it was something else?
                    })
                    .eq('id', req.booking_id);

                if (bookingError) throw bookingError;

                toast.success('Reschedule approved & booking updated');
            } else {
                const { error } = await supabase
                    .from('reschedule_requests')
                    .update({ status: 'rejected' })
                    .eq('id', id);

                if (error) throw error;
                toast.success('Reschedule request rejected');
            }

            fetchRequests();
            setSelectedRequest(null);
        } catch (error) {
            console.error('Error processing request:', error);
            toast.error('Failed to process request');
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredRequests = requests.filter(r => {
        if (filter === 'all') return true;
        if (filter === 'pending') return r.status === 'pending';
        return r.status === filter;
    });

    const getReasonIcon = (reason: string) => {
        switch (reason) {
            case 'weather': return <CloudRain className="text-blue-400" />;
            case 'personal': return <Search className="text-purple-400" />; // Placeholder
            case 'emergency': return <AlertTriangle className="text-red-400" />;
            default: return <Clock className="text-gray-400" />;
        }
    };

    if (loading) return <BrandedLoader fullPage />;

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-4 lg:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white mb-2">Smart Rescheduling</h1>
                    <p className="text-[#888]">Manage appointment change requests and AI suggestions</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl">
                    {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === tab
                                ? 'bg-[#ff1744] text-white shadow-lg shadow-[#ff1744]/25'
                                : 'text-[#888] hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-blue-500/10 to-transparent"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500">
                            <CloudRain size={24} />
                        </div>
                        <div>
                            <p className="text-[#888] text-sm font-medium uppercase tracking-wider">Weather Impact</p>
                            <h3 className="text-2xl font-bold text-white">Low Risk</h3>
                        </div>
                    </div>
                    <p className="text-sm text-[#888]">
                        Upcoming forecast looks clear. Minimal weather-related rescheduling expected.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-purple-500/10 to-transparent"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/20 text-purple-500">
                            <RefreshCw size={24} />
                        </div>
                        <div>
                            <p className="text-[#888] text-sm font-medium uppercase tracking-wider">Auto-Approvals</p>
                            <h3 className="text-2xl font-bold text-white">
                                {requests.filter(r => r.status === 'auto_approved').length}
                            </h3>
                        </div>
                    </div>
                    <p className="text-sm text-[#888]">
                        Requests automatically handled by Smart AI logic this month.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-orange-500/10 to-transparent"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-orange-500/20 text-orange-500">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-[#888] text-sm font-medium uppercase tracking-wider">Pending Action</p>
                            <h3 className="text-2xl font-bold text-white">
                                {requests.filter(r => r.status === 'pending').length}
                            </h3>
                        </div>
                    </div>
                    <p className="text-sm text-[#888]">
                        Requests requiring manual review.
                    </p>
                </motion.div>
            </div>

            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold">Request Queue</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase tracking-wider">Customer / Vehicle</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase tracking-wider">Original Slot</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase tracking-wider">Requested New Slot</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-[#888] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-bold text-white">{req.user?.full_name || 'Unknown User'}</p>
                                            <p className="text-xs text-[#888]">{req.booking?.car_model} • {req.booking?.service?.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-[#888] line-through decoration-red-500/50">
                                            <Calendar size={14} />
                                            <span className="text-sm">{req.original_date}</span>
                                            <Clock size={14} className="ml-1" />
                                            <span className="text-sm">{req.original_time}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-green-400 font-medium">
                                            <Calendar size={14} />
                                            <span>{req.requested_date}</span>
                                            <Clock size={14} className="ml-1" />
                                            <span>{req.requested_time}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {getReasonIcon(req.reason)}
                                            <span className="text-sm capitalize">{(req.reason || 'unknown').replace('_', ' ')}</span>
                                        </div>
                                        {req.reason_details && (
                                            <p className="text-xs text-[#666] mt-1 max-w-[200px] truncate">{req.reason_details}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${req.status === 'approved' || req.status === 'auto_approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                            req.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            }`}>
                                            {req.status === 'approved' || req.status === 'auto_approved' ? <CheckCircle size={12} /> :
                                                req.status === 'rejected' ? <XCircle size={12} /> :
                                                    <Clock size={12} />}
                                            {req.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {req.status === 'pending' && (
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleAction(req.id, 'approve')}
                                                    disabled={isProcessing}
                                                    className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 disabled:opacity-50"
                                                    title="Approve Request"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(req.id, 'reject')}
                                                    disabled={isProcessing}
                                                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-50"
                                                    title="Reject Request"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {filteredRequests.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-[#666]">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                                <RefreshCw size={24} className="text-[#444]" />
                                            </div>
                                            <p>No {filter} requests found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
