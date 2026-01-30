"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, AlertCircle, X, Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";

interface RescheduleModalProps {
    booking: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function RescheduleModal({ booking, isOpen, onClose, onSuccess }: RescheduleModalProps) {
    const [reason, setReason] = useState<string>("personal");
    const [reasonDetails, setReasonDetails] = useState("");
    const [requestedDate, setRequestedDate] = useState("");
    const [requestedTime, setRequestedTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!requestedDate || !requestedTime) {
            toast.error("Please select a new date and time");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/bookings/${booking.id}/reschedule`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reason,
                    reason_details: reasonDetails,
                    requested_date: requestedDate,
                    requested_time: requestedTime,
                }),
            });

            if (!response.ok) throw new Error("Failed to submit reschedule request");

            toast.success("Reschedule request submitted successfully!");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error("Failed to submit request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#ff1744]/10 to-[#d4af37]/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center">
                                    <Calendar className="text-white" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Reschedule Booking</h3>
                                    <p className="text-xs text-[#888]">Service: {booking.service?.name || "Premium Detailing"}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/50 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2 text-white/80">
                                        <Calendar size={14} className="text-[#ff1744]" />
                                        New Date
                                    </label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={requestedDate}
                                        onChange={(e) => setRequestedDate(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none transition-colors text-sm text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2 text-white/80">
                                        <Clock size={14} className="text-[#ff1744]" />
                                        New Time
                                    </label>
                                    <input
                                        type="time"
                                        value={requestedTime}
                                        onChange={(e) => setRequestedTime(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none transition-colors text-sm text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2 text-white/80">
                                    <AlertCircle size={14} className="text-[#ff1744]" />
                                    Reason for Reschedule
                                </label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none transition-colors text-sm text-white appearance-none"
                                >
                                    <option value="personal">Personal Reason</option>
                                    <option value="weather">Weather Related</option>
                                    <option value="emergency">Emergency</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80">Additional Details (Optional)</label>
                                <textarea
                                    value={reasonDetails}
                                    onChange={(e) => setReasonDetails(e.target.value)}
                                    className="w-full h-24 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none transition-colors resize-none text-sm text-white"
                                    placeholder="Tell us why you need to reschedule..."
                                />
                            </div>

                            <div className="p-4 rounded-xl bg-[#ff1744]/5 border border-[#ff1744]/10">
                                <p className="text-xs text-white/60 leading-relaxed">
                                    Note: Reschedule requests are subject to availability and approval by our team.
                                    You will receive a notification once your request has been reviewed.
                                </p>
                            </div>

                            <button
                                disabled={isSubmitting}
                                onClick={handleSubmit}
                                className="w-full btn-premium py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Submit Request
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
