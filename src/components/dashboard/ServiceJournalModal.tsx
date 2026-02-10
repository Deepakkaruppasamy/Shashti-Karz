"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, FileText, Star, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface ServiceJournalModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicleId: string;
    onSuccess: () => void;
}

export function ServiceJournalModal({ isOpen, onClose, vehicleId, onSuccess }: ServiceJournalModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        service_name: "",
        service_date: new Date().toISOString().split('T')[0],
        mileage: "",
        customer_notes: "",
        quality_rating: 5,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from("service_journal_entries")
                .insert({
                    vehicle_id: vehicleId,
                    user_id: user.id,
                    service_name: formData.service_name,
                    service_date: formData.service_date,
                    mileage: formData.mileage ? parseInt(formData.mileage) : null,
                    customer_notes: formData.customer_notes,
                    quality_rating: formData.quality_rating,
                });

            if (error) throw error;

            toast.success("Service entry added successfully!");
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                service_name: "",
                service_date: new Date().toISOString().split('T')[0],
                mileage: "",
                customer_notes: "",
                quality_rating: 5,
            });
        } catch (error) {
            console.error("Error adding service entry:", error);
            toast.error("Failed to add service entry");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden"
                >
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold">Add Service Record</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#888] mb-1">
                                Service Name
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Annual Maintenance, Oil Change"
                                value={formData.service_name}
                                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-[#d4af37] focus:outline-none transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[#888] mb-1">
                                    Date
                                </label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
                                    <input
                                        type="date"
                                        required
                                        value={formData.service_date}
                                        onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:border-[#d4af37] focus:outline-none transition-colors [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#888] mb-1">
                                    Mileage (km)
                                </label>
                                <input
                                    type="number"
                                    placeholder="Optional"
                                    value={formData.mileage}
                                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-[#d4af37] focus:outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#888] mb-1">
                                Notes
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Any observations or details..."
                                value={formData.customer_notes}
                                onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-[#d4af37] focus:outline-none transition-colors resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#888] mb-2">
                                Rating
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, quality_rating: star })}
                                        className="p-1 hover:scale-110 transition-transform"
                                    >
                                        <Star
                                            size={24}
                                            className={star <= formData.quality_rating ? "fill-[#d4af37] text-[#d4af37]" : "text-[#888]"}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-premium px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                            >
                                {isLoading && <Loader2 size={16} className="animate-spin" />}
                                Save Entry
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
