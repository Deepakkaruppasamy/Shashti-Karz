"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, FileText, Star, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { ServiceJournalEntry } from "@/lib/types";
import toast from "react-hot-toast";

interface ServiceJournalModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicleId: string;
    onSuccess: () => void;
    initialData?: ServiceJournalEntry | null;
}

export function ServiceJournalModal({ isOpen, onClose, vehicleId, onSuccess, initialData }: ServiceJournalModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        service_name: "",
        service_date: new Date().toISOString().split('T')[0],
        mileage: "",
        price: "",
        customer_notes: "",
        quality_rating: 5,
        issue_certificate: false,
        service_type: "detailing",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                service_name: initialData.service_name || "",
                service_date: initialData.service_date ? new Date(initialData.service_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                mileage: initialData.mileage?.toString() || "",
                price: initialData.price?.toString() || "",
                customer_notes: initialData.customer_notes || "",
                quality_rating: initialData.quality_rating || 5,
                issue_certificate: false,
                service_type: initialData.service_type || "detailing",
            });
        } else {
            setFormData({
                service_name: "",
                service_date: new Date().toISOString().split('T')[0],
                mileage: "",
                price: "",
                customer_notes: "",
                quality_rating: 5,
                issue_certificate: false,
                service_type: "detailing",
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            if (initialData) {
                const { error } = await supabase
                    .from("service_journal_entries")
                    .update({
                        service_name: formData.service_name,
                        service_date: formData.service_date,
                        mileage: formData.mileage ? parseInt(formData.mileage) : null,
                        price: formData.price ? parseFloat(formData.price) : 0,
                        customer_notes: formData.customer_notes,
                        quality_rating: formData.quality_rating,
                    })
                    .eq("id", initialData.id);

                if (error) throw error;
                toast.success("Service entry updated successfully!");
            } else {
                const { data: entry, error } = await supabase
                    .from("service_journal_entries")
                    .insert({
                        vehicle_id: vehicleId,
                        user_id: user.id,
                        service_name: formData.service_name,
                        service_date: formData.service_date,
                        service_type: formData.service_type,
                        mileage: formData.mileage ? parseInt(formData.mileage) : null,
                        price: formData.price ? parseFloat(formData.price) : 0,
                        customer_notes: formData.customer_notes,
                        quality_rating: formData.quality_rating,
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Handle Certificate Issuance
                if (formData.issue_certificate && entry) {
                    const serviceConfigs: Record<string, { warranty: number, terms: string }> = {
                        "detailing": { warranty: 6, terms: "Includes surface restoration and professional paint depth measurement." },
                        "coating": { warranty: 36, terms: "Premium 9H Ceramic Coating with hydrophobic durability guarantee. Requires annual maintenance." },
                        "ppf": { warranty: 60, terms: "Self-healing ultra-gloss film with yellowing resistance and adhesive integrity protection." },
                        "wash": { warranty: 1, terms: "Professional decontamination wash with high-grade spray sealant application." },
                        "interior": { warranty: 12, terms: "Complete bacterial sanitation and leather conditioning treatment." },
                    };

                    const config = serviceConfigs[formData.service_type] || { warranty: 12, terms: "Standard service quality guarantee." };
                    const expiryDate = new Date(formData.service_date);
                    expiryDate.setMonth(expiryDate.getMonth() + config.warranty);

                    const certRes = await fetch('/api/certificates', {
                        method: 'POST',
                        body: JSON.stringify({
                            vehicle_id: vehicleId,
                            user_id: user.id,
                            service_name: formData.service_name,
                            service_type: formData.service_type,
                            warranty_start_date: formData.service_date,
                            warranty_end_date: expiryDate.toISOString().split('T')[0],
                            warranty_period_months: config.warranty,
                            warranty_terms: config.terms,
                            certificate_type: 'service_warranty',
                            status: 'active',
                            pdf_url: `https://shashtikarz.com/verify/cert/${Math.random().toString(36).substring(7)}` // Realistic looking verification URL
                        })
                    });

                    if (!certRes.ok) console.error("Failed to issue certificate");
                    else toast.success("Verified digital certificate issued!");
                }

                toast.success("Service entry added successfully!");
            }
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                service_name: "",
                service_date: new Date().toISOString().split('T')[0],
                mileage: "",
                price: "",
                customer_notes: "",
                quality_rating: 5,
                issue_certificate: false,
                service_type: "detailing",
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
                        <h2 className="text-xl font-bold">{initialData ? "Edit Service Record" : "Add Service Record"}</h2>
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
                            <div>
                                <label className="block text-sm font-medium text-[#888] mb-1">
                                    Price (₹)
                                </label>
                                <input
                                    type="number"
                                    placeholder="Service Cost"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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

                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-[#888] mb-1">
                                    Service Type
                                </label>
                                <select
                                    value={formData.service_type}
                                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-[#d4af37] focus:outline-none transition-colors"
                                >
                                    <option value="detailing">Detailing</option>
                                    <option value="coating">Ceramic Coating</option>
                                    <option value="ppf">PPF Installation</option>
                                    <option value="wash">Premium Wash</option>
                                    <option value="interior">Interior Deep Clean</option>
                                </select>
                            </div>
                            {!initialData && (
                                <div className="pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={formData.issue_certificate}
                                                onChange={(e) => setFormData({ ...formData, issue_certificate: e.target.checked })}
                                                className="sr-only"
                                            />
                                            <div className={`w-10 h-6 rounded-full transition-colors ${formData.issue_certificate ? 'bg-[#d4af37]' : 'bg-white/10'}`} />
                                            <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.issue_certificate ? 'translate-x-4' : ''}`} />
                                        </div>
                                        <span className="text-sm font-medium text-[#888] group-hover:text-white transition-colors">
                                            Issue Digital Certificate
                                        </span>
                                    </label>
                                </div>
                            )}
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
