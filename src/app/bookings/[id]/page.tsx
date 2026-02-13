"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
    Activity, Clock, MapPin, Calendar, CheckCircle,
    XCircle, AlertCircle, Phone, MessageSquare, Car,
    Zap, Award, Crown, Gift, Eye, Package, Send, ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { BrandedLoader } from "@/components/animations/BrandedLoader";

// Define stages for progress tracking
const SERVICE_STAGES = [
    { id: "received", name: "Car Received", icon: Car, description: "Vehicle checked in at facility" },
    { id: "inspection", name: "Inspection", icon: Eye, description: "Detailed condition report creating" },
    { id: "washing", name: "Washing", icon: Zap, description: "High-pressure foam wash" },
    { id: "detailing", name: "Detailing", icon: Package, description: "Interior & exterior deep cleaning" },
    { id: "polishing", name: "Polishing", icon: Award, description: "Paint correction & shine enhancement" },
    { id: "coating", name: "Coating", icon: Crown, description: "Applying ceramic/graphene protection" },
    { id: "quality_check", name: "Quality Check", icon: CheckCircle, description: "Final inspection by supervisor" },
    { id: "ready", name: "Ready for Pickup", icon: Gift, description: "Your car is sparkling new!" },
    { id: "delivered", name: "Delivered", icon: Send, description: "Service completed successfully" },
];

interface BookingDetails {
    id: string;
    status: string;
    service_name: string;
    car_model: string;
    booking_date: string;
    time_slot: string;
    total_amount: number;
    assigned_worker?: {
        name: string;
        phone: string;
    };
}

interface ServiceTracking {
    id: string;
    booking_id: string;
    stage: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    updated_at: string;
}

export default function BookingDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [tracking, setTracking] = useState<ServiceTracking[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch initial data
    useEffect(() => {
        if (params.id) {
            fetchBookingDetails();
        }
    }, [params.id]);

    const fetchBookingDetails = async () => {
        try {
            const res = await fetch(`/api/bookings/${params.id}`);
            if (!res.ok) throw new Error("Booking not found");
            const data = await res.json();
            setBooking(data.booking);
            setTracking(data.tracking || []);
        } catch (error) {
            console.error("Error fetching booking:", error);
            // router.push("/my-bookings"); // Redirect on error for better UX? or show error state
        } finally {
            setLoading(false);
        }
    };

    // Real-time: Listen for Booking Status Updates
    useRealtimeSubscription({
        table: 'bookings',
        filter: `id=eq.${params.id}`,
        onUpdate: (payload) => {
            setBooking(prev => prev ? { ...prev, ...payload } : null);
        }
    });

    // Real-time: Listen for Service Progress Updates
    useRealtimeSubscription({
        table: 'service_tracking',
        filter: `booking_id=eq.${params.id}`,
        onInsert: (payload) => {
            setTracking(prev => [...prev, payload]);
        },
        onUpdate: (payload) => {
            setTracking(prev => prev.map(t => t.id === payload.id ? payload : t));
        }
    });

    const getCurrentStageIndex = () => {
        // Find the last completed stage or the current in-progress one
        const completedStages = tracking.filter(t => t.status === 'completed');
        const inProgressStage = tracking.find(t => t.status === 'in_progress');

        if (inProgressStage) {
            return SERVICE_STAGES.findIndex(s => s.id === inProgressStage.stage);
        }

        if (completedStages.length > 0) {
            // Return the last completed one logic, maybe tricky if out of order
            // Let's assume sequential for simplicity or map by id
            return Math.max(...completedStages.map(t => SERVICE_STAGES.findIndex(s => s.id === t.stage)));
        }

        return -1; // Not started
    };

    const currentStageIndex = getCurrentStageIndex();

    if (loading) return <BrandedLoader fullPage />;

    if (!booking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Booking Not Found</h2>
                    <Link href="/my-bookings" className="text-blue-600 hover:underline mt-4 block">Back to My Bookings</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 lg:p-8 pb-24">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/my-bookings" className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold font-display">Tracking Order #{booking.id.slice(0, 8)}</h1>
                        <p className="text-[#888] text-sm">Live updates from the workshop</p>
                    </div>
                </div>

                {/* Status Card */}
                <div className="glass-card p-6 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-900/20 to-transparent relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/30 animate-pulse">
                                    {booking.status.replace('_', ' ')}
                                </span>
                                <span className="text-[#888] text-xs uppercase tracking-wider font-bold">
                                    • Assigned to {booking.assigned_worker?.name || "TBD"}
                                </span>
                            </div>
                            <h2 className="text-3xl font-bold mb-1">{booking.service_name}</h2>
                            <p className="text-[#ccc]">{booking.car_model}</p>
                        </div>

                        <div className="flex gap-4">
                            {/* Quick Stats or Actions */}
                            <div className="text-right">
                                <p className="text-sm text-[#888] uppercase tracking-wider font-bold">Estimated Completion</p>
                                <p className="text-xl font-bold">
                                    {currentStageIndex >= SERVICE_STAGES.length - 1 ? "Completed" : "Today, 6:00 PM"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="glass-card p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Activity className="text-blue-500" /> Service Timeline
                    </h3>

                    <div className="space-y-8 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-white/10">
                        {SERVICE_STAGES.map((stage, index) => {
                            const trackInfo = tracking.find(t => t.stage === stage.id);
                            const status = trackInfo?.status || (index < currentStageIndex ? 'completed' : index === currentStageIndex ? 'in_progress' : 'pending');
                            const isActive = status === 'in_progress';
                            const isCompleted = status === 'completed';

                            return (
                                <motion.div
                                    key={stage.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative flex gap-6"
                                >
                                    <div className={`
                                        relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 transition-all duration-500
                                        ${isActive ? 'bg-blue-500 border-blue-500/30' :
                                            isCompleted ? 'bg-green-500 border-green-500/30' :
                                                'bg-[#111] border-white/10 text-[#444]'}
                                    `}>
                                        <stage.icon size={20} className={isActive || isCompleted ? 'text-white' : ''} />
                                        {isActive && (
                                            <span className="absolute inset-0 rounded-full animate-ping bg-blue-500/50" />
                                        )}
                                    </div>

                                    <div className={`flex-1 pt-2 ${isActive ? 'text-white' : isCompleted ? 'text-[#ccc]' : 'text-[#666]'}`}>
                                        <h4 className="font-bold text-lg mb-1">{stage.name}</h4>
                                        <p className="text-sm opacity-80">{stage.description}</p>
                                        {trackInfo?.updated_at && (
                                            <p className="text-xs mt-1 opacity-50 font-mono">
                                                {new Date(trackInfo.updated_at).toLocaleTimeString()}
                                            </p>
                                        )}
                                    </div>

                                    {isActive && (
                                        <div className="absolute right-0 top-2">
                                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-md tracking-wider">
                                                Current Stage
                                            </span>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Additional Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Clock size={16} className="text-purple-500" /> Appointment Details
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-[#888]">Date</span>
                                <span className="font-medium">{new Date(booking.booking_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-[#888]">Time Slot</span>
                                <span className="font-medium">{booking.time_slot}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#888]">Location</span>
                                <span className="font-medium">Shashti Karz, New Delhi</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Phone size={16} className="text-green-500" /> Support & Contact
                        </h3>
                        {booking.assigned_worker ? (
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold">
                                    {booking.assigned_worker.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Specialist: {booking.assigned_worker.name}</p>
                                    <p className="text-xs text-[#888]">Working on your vehicle</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-[#888] mb-4">Worker assignment pending...</p>
                        )}
                        <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                            <MessageSquare size={16} /> Contact Support
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
