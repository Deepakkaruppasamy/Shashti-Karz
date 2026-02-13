"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Calendar, Clock, MapPin, DollarSign, Star, MoreVertical, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { RescheduleModal } from "@/components/RescheduleModal";
import { ReviewModal } from "@/components/ReviewModal";
import { BrandedLoader } from "@/components/animations/BrandedLoader";

interface Booking {
    id: string;
    service_name: string;
    booking_date: string;
    time_slot: string;
    location: string;
    total_amount: number;
    status: string;
    payment_status: string;
    created_at: string;
}

export default function MyBookingsPage() {
    const { user, profile } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");

    // Modal State
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchBookings();
        }
    }, [user]);

    // Real-time subscription for bookings
    useRealtimeSubscription({
        table: 'bookings',
        filter: user ? `user_id=eq.${user.id}` : undefined,
        onInsert: () => fetchBookings(),
        onUpdate: () => fetchBookings(),
        onDelete: () => fetchBookings(),
    });

    const fetchBookings = async () => {
        try {
            const response = await fetch(`/api/bookings?userId=${user?.id}`);
            const data = await response.json();
            setBookings(data.bookings || []);
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReschedule = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsRescheduleOpen(true);
    };

    const handleReview = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsReviewOpen(true);
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
            confirmed: "bg-blue-100 text-blue-800 border-blue-300",
            in_progress: "bg-purple-100 text-purple-800 border-purple-300",
            completed: "bg-green-100 text-green-800 border-green-300",
            cancelled: "bg-red-100 text-red-800 border-red-300",
        };
        return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
    };

    const filteredBookings = bookings.filter((booking) => {
        if (filter === "upcoming") {
            return booking.status === "pending" || booking.status === "confirmed" || booking.status === "in_progress";
        }
        if (filter === "completed") {
            return booking.status === "completed";
        }
        return true;
    });

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-24 pb-12 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <Calendar className="mx-auto mb-6 text-blue-600" size={64} />
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">My Bookings</h1>
                    <p className="text-lg text-gray-600 mb-8">
                        Login to view and manage your bookings!
                    </p>
                    <a
                        href="/login"
                        className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-8 py-4 rounded-xl hover:shadow-lg transition-all"
                    >
                        Login to Continue
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-24 pb-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
                        <p className="text-gray-600">
                            Hello, <strong>{profile?.full_name || "Customer"}</strong>!
                        </p>
                    </div>
                    {/* Live Indicator */}
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Live Updates
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-8 bg-white p-2 rounded-2xl shadow-lg w-fit">
                    {(["all", "upcoming", "completed"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-6 py-3 rounded-xl font-semibold capitalize transition-all ${filter === t
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                                : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Bookings List */}
                {loading ? (
                    <BrandedLoader />
                ) : filteredBookings.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-lg">
                        <AlertCircle className="mx-auto mb-4 text-gray-400" size={64} />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Bookings Found</h2>
                        <p className="text-gray-600 mb-6">
                            {filter === "all"
                                ? "You haven't made any bookings yet."
                                : `No ${filter} bookings at the moment.`}
                        </p>
                        <Link
                            href="/booking"
                            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-8 py-4 rounded-xl hover:shadow-lg transition-all"
                        >
                            Book Your First Service
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredBookings.map((booking) => (
                            <div
                                key={booking.id}
                                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-200"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex-1">
                                        {/* Status Badges */}
                                        <div className="flex gap-2 mb-3">
                                            <span
                                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(
                                                    booking.status
                                                )}`}
                                            >
                                                {booking.status.replace("_", " ")}
                                            </span>
                                            <span
                                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${booking.payment_status === "paid"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-orange-100 text-orange-800"
                                                    }`}
                                            >
                                                {booking.payment_status === "paid" ? "PAID" : "PENDING PAYMENT"}
                                            </span>
                                        </div>

                                        {/* Service Name */}
                                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                                            {booking.service_name}
                                        </h3>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-sm">
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <Calendar size={16} className="text-blue-600" />
                                                <span className="font-medium">{new Date(booking.booking_date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <Clock size={16} className="text-purple-600" />
                                                <span className="font-medium">{booking.time_slot}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <MapPin size={16} className="text-green-600" />
                                                <span className="truncate font-medium">{booking.location}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <DollarSign size={16} className="text-yellow-600" />
                                                <span className="font-bold">₹{booking.total_amount}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex md:flex-col gap-3 shrink-0">
                                        <Link
                                            href={`/booking?id=${booking.id}`} // Assuming redirect to re-book or similar if detailed view is missing
                                            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-bold text-center"
                                        >
                                            View
                                        </Link>

                                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                            <button
                                                onClick={() => handleReschedule(booking)}
                                                className="px-6 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                                            >
                                                <RefreshCw size={16} />
                                                Reschedule
                                            </button>
                                        )}

                                        {booking.status === "completed" && (
                                            <button
                                                onClick={() => handleReview(booking)}
                                                className="px-6 py-2.5 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-100 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                                            >
                                                <Star size={16} />
                                                Review
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Quick Book */}
                <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl">
                    <h2 className="text-2xl font-bold mb-2">Ready for Your Next Detail?</h2>
                    <p className="mb-4 text-white/90">
                        Book another service and earn more rewards points!
                    </p>
                    <Link
                        href="/booking"
                        className="inline-block bg-white text-blue-600 font-bold px-8 py-3 rounded-xl hover:shadow-lg transition-all"
                    >
                        Book New Service
                    </Link>
                </div>
            </div>

            {/* Modals */}
            {selectedBooking && selectedBooking && (
                <>
                    <RescheduleModal
                        booking={selectedBooking}
                        isOpen={isRescheduleOpen}
                        onClose={() => setIsRescheduleOpen(false)}
                        onSuccess={() => {
                            // Realtime will catch the update, but we can optimistically refresh too
                            fetchBookings();
                        }}
                    />
                    <ReviewModal
                        booking={selectedBooking}
                        isOpen={isReviewOpen}
                        onClose={() => setIsReviewOpen(false)}
                        onSuccess={() => {
                            // Refresh logic if needed
                        }}
                    />
                </>
            )}
        </div>
    );
}
