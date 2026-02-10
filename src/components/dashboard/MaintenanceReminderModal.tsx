"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Bell, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface MaintenanceReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicleId: string;
    onSuccess: () => void;
}

export function MaintenanceReminderModal({ isOpen, onClose, vehicleId, onSuccess }: MaintenanceReminderModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        reminder_type: "general",
        due_date: "",
        priority: "medium",
        description: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from("vehicle_maintenance_reminders")
                .insert({
                    vehicle_id: vehicleId,
                    user_id: user.id,
                    title: formData.title,
                    reminder_type: formData.reminder_type,
                    due_date: formData.due_date,
                    priority: formData.priority,
                    description: formData.description,
                    status: 'active'
                });

            if (error) throw error;

            toast.success("Reminder set successfully!");
            onSuccess();
            onClose();
            setFormData({
                title: "",
                reminder_type: "general",
                due_date: "",
                priority: "medium",
                description: "",
            });
        } catch (error) {
            console.error("Error creating reminder:", error);
            toast.error("Failed to create reminder");
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
                        <h2 className="text-xl font-bold">Add Reminder</h2>
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
                                Title
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Tyre Rotation, Insurance Renewal"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-[#d4af37] focus:outline-none transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[#888] mb-1">
                                    Type
                                </label>
                                <select
                                    value={formData.reminder_type}
                                    onChange={(e) => setFormData({ ...formData, reminder_type: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-[#d4af37] focus:outline-none transition-colors text-white"
                                >
                                    <option value="general">General</option>
                                    <option value="service">Service</option>
                                    <option value="insurance">Insurance</option>
                                    <option value="repair">Repair</option>
                                    <option value="upgrade">Upgrade</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#888] mb-1">
                                    Priority
                                </label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-[#d4af37] focus:outline-none transition-colors text-white"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#888] mb-1">
                                Due Date
                            </label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
                                <input
                                    type="date"
                                    required
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:border-[#d4af37] focus:outline-none transition-colors [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#888] mb-1">
                                Description
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Additional details..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-[#d4af37] focus:outline-none transition-colors resize-none"
                            />
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
                                Set Reminder
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
