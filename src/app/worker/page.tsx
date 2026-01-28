"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Car, Clock, CheckCircle, RefreshCw, ChevronRight,
    MapPin, User, Phone, Zap, Eye, Package, Send,
    AlertTriangle, Hammer, Shield, Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";
import { Navbar } from "@/components/Navbar";
import type { Booking, ServiceTracking, Worker } from "@/lib/types";

const SERVICE_STAGES = [
    { id: "received", name: "Car Received", icon: Car },
    { id: "inspection", name: "Inspection", icon: Eye },
    { id: "washing", name: "Washing", icon: Zap },
    { id: "detailing", name: "Detailing", icon: Package },
    { id: "polishing", name: "Polishing", icon: Hammer },
    { id: "coating", name: "Coating", icon: Shield },
    { id: "drying", name: "Drying", icon: Clock },
    { id: "quality_check", name: "QC Pass", icon: CheckCircle },
    { id: "ready", name: "Ready", icon: Sparkles },
    { id: "delivered", name: "Delivered", icon: Send },
];

export default function WorkerDashboard() {
    const { user, profile } = useAuth();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
    const [assignedBookings, setAssignedBookings] = useState<Booking[]>([]);
    const [trackingData, setTrackingData] = useState<Record<string, ServiceTracking[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    const fetchWorkerData = useCallback(async () => {
        if (!selectedWorkerId) return;

        setIsLoading(true);
        try {
            const { data: bookingsData, error: bookingsError } = await supabase
                .from("bookings")
                .select("*, service:services(*)")
                .eq("assigned_worker_id", selectedWorkerId)
                .in("status", ["approved", "in_progress"])
                .order("created_at", { ascending: false });

            if (bookingsError) throw bookingsError;
            setAssignedBookings(bookingsData || []);

            // Fetch tracking for each booking
            for (const booking of bookingsData || []) {
                const { data: trackData } = await supabase
                    .from("service_tracking")
                    .select("*")
                    .eq("booking_id", booking.id);

                if (trackData) {
                    setTrackingData(prev => ({ ...prev, [booking.id]: trackData }));
                }
            }
        } catch (error) {
            console.error("Error fetching worker tasks:", error);
            toast.error("Failed to load your tasks");
        } finally {
            setIsLoading(false);
        }
    }, [selectedWorkerId]);

    useEffect(() => {
        const fetchWorkers = async () => {
            const { data } = await supabase.from("workers").select("*").eq("status", "active");
            if (data) setWorkers(data);
        };
        fetchWorkers();
    }, []);

    useEffect(() => {
        fetchWorkerData();

        // Set up real-time subscription for bookings assigned to this worker
        if (selectedWorkerId) {
            const subscription = supabase
                .channel(`worker-tasks-${selectedWorkerId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `assigned_worker_id=eq.${selectedWorkerId}`
                }, () => {
                    fetchWorkerData();
                })
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [selectedWorkerId, fetchWorkerData]);

    const handleUpdateStage = async (bookingId: string, stageId: string, currentStatus: string) => {
        try {
            const nextStatus = currentStatus === "pending" ? "in_progress" : "completed";

            const { data: existing } = await supabase
                .from("service_tracking")
                .select("id")
                .eq("booking_id", bookingId)
                .eq("stage", stageId)
                .single();

            if (existing) {
                await supabase
                    .from("service_tracking")
                    .update({
                        status: nextStatus,
                        started_at: nextStatus === "in_progress" ? new Date().toISOString() : undefined,
                        completed_at: nextStatus === "completed" ? new Date().toISOString() : undefined
                    })
                    .eq("id", existing.id);
            } else {
                await supabase
                    .from("service_tracking")
                    .insert([{
                        booking_id: bookingId,
                        stage: stageId,
                        status: nextStatus,
                        started_at: nextStatus === "in_progress" ? new Date().toISOString() : null,
                        completed_at: nextStatus === "completed" ? new Date().toISOString() : null
                    }]);
            }

            // If it's the first stage, update booking status to in_progress
            if (stageId === "received" && nextStatus === "in_progress") {
                await supabase.from("bookings").update({ status: "in_progress" }).eq("id", bookingId);
            }

            // If it's the last stage and completed, update booking status to completed
            if (stageId === "delivered" && nextStatus === "completed") {
                await supabase.from("bookings").update({ status: "completed" }).eq("id", bookingId);
                toast.success("Job Completed & Delivered!");
            } else {
                toast.success(`${stageId} marked as ${nextStatus}`);
            }

            fetchWorkerData();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    if (!selectedWorkerId) {
        return (
            <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
                <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-white/5">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#ff1744] to-[#d4af37] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <User size={40} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold">Worker Portal</h1>
                        <p className="text-[#888] text-sm mt-2">Select your specialist profile to begin</p>
                    </div>
                    <div className="space-y-3">
                        {workers.map(w => (
                            <button
                                key={w.id}
                                onClick={() => setSelectedWorkerId(w.id)}
                                className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#ff1744]/50 hover:bg-white/10 transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-[#ff1744]">{w.name.charAt(0)}</div>
                                    <div className="text-left">
                                        <p className="font-bold group-hover:text-white transition-colors">{w.name}</p>
                                        <p className="text-xs text-[#666]">{w.role}</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-[#333] group-hover:text-[#ff1744] transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    const currentWorker = workers.find(w => w.id === selectedWorkerId);

    return (
        <main className="min-h-screen bg-[#0a0a0a]">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <p className="text-[#ff1744] font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#ff1744] animate-pulse" /> Live Terminal
                        </p>
                        <h1 className="text-3xl font-black italic">SHASHTI <span className="text-[#ff1744]">PRO</span></h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="font-bold text-sm">{currentWorker?.name}</p>
                            <p className="text-[10px] text-[#888] uppercase">{currentWorker?.role}</p>
                        </div>
                        <button onClick={() => setSelectedWorkerId(null)} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-xl hover:bg-red-500/20 text-red-500 transition-colors">
                            <User size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Exit Portal</span>
                        </button>
                    </div>
                </header>

                <div className="grid gap-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-3"><Clock className="text-[#d4af37]" /> Assigned Active Jobs</h2>
                        {isLoading && <RefreshCw size={18} className="animate-spin text-[#666]" />}
                    </div>

                    {assignedBookings.length === 0 ? (
                        <div className="glass-card py-20 text-center rounded-3xl border-dashed border-white/10">
                            <Car size={60} className="mx-auto text-[#222] mb-4" />
                            <h3 className="text-[#666] font-medium">No jobs currently assigned.</h3>
                            <p className="text-xs text-[#444] mt-1">Assignments from admin will appear here in real-time.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {assignedBookings.map((booking) => {
                                const tracking = trackingData[booking.id] || [];
                                const currentStageIndex = SERVICE_STAGES.findIndex(s =>
                                    tracking.find(t => t.stage === s.id && t.status !== "completed")
                                );
                                const progress = (tracking.filter(t => t.status === "completed").length / SERVICE_STAGES.length) * 100;

                                return (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={booking.id}
                                        className="glass-card rounded-3xl border border-white/5 overflow-hidden"
                                    >
                                        <div className="p-6 sm:p-8 bg-white/5 border-b border-white/5">
                                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center text-white shadow-lg">
                                                        <Car size={32} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-extrabold">{booking.car_model}</h3>
                                                        <p className="text-xs text-[#ff1744] font-bold uppercase tracking-wider">{booking.service?.name}</p>
                                                        <div className="flex gap-4 mt-2">
                                                            <span className="flex items-center gap-1.5 text-[10px] text-[#666]"><User size={10} /> {booking.customer_name}</span>
                                                            <span className="flex items-center gap-1.5 text-[10px] text-[#666]"><Clock size={10} /> {booking.time}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-3xl font-black text-gradient">{Math.round(progress)}%</div>
                                                    <p className="text-[10px] text-[#888] uppercase font-bold">Progress</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 sm:p-8">
                                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                                {SERVICE_STAGES.map((stage) => {
                                                    const track = tracking.find(t => t.stage === stage.id);
                                                    const status = track?.status || "pending";

                                                    return (
                                                        <button
                                                            key={stage.id}
                                                            onClick={() => handleUpdateStage(booking.id, stage.id, status)}
                                                            className={`p-4 rounded-2xl border transition-all text-center group ${status === "completed"
                                                                ? "bg-green-500/10 border-green-500/20 text-green-500"
                                                                : status === "in_progress"
                                                                    ? "bg-[#ff1744]/10 border-[#ff1744]/20 text-[#ff1744] animate-pulse"
                                                                    : "bg-white/5 border-white/5 text-[#444] hover:border-[#ff1744]/30 hover:text-[#888]"
                                                                }`}
                                                        >
                                                            <stage.icon size={20} className="mx-auto mb-2" />
                                                            <p className="text-[9px] font-black uppercase tracking-tighter">{stage.name}</p>
                                                            <p className="text-[8px] opacity-60 mt-1">{status}</p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
