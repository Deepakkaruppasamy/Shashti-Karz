"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Camera, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";

interface ChecklistItem {
    step: string;
    required: boolean;
    order: number;
}

interface CompletedItem {
    step: string;
    completed: boolean;
    timestamp: string;
    notes?: string;
}

interface Photo {
    step: string;
    url: string;
    uploaded_at: string;
}

interface ChecklistFormProps {
    bookingId: string;
    checklistId: string;
    items: ChecklistItem[];
    onComplete: () => void;
}

export function ChecklistForm({ bookingId, checklistId, items, onComplete }: ChecklistFormProps) {
    const [completedItems, setCompletedItems] = useState<CompletedItem[]>([]);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [notes, setNotes] = useState("");
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load existing completion if any
    useEffect(() => {
        loadCompletion();
    }, [bookingId, checklistId]);

    const loadCompletion = async () => {
        try {
            const res = await fetch(`/api/checklists/${checklistId}/complete?booking_id=${bookingId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.completion) {
                    setCompletedItems(data.completion.completed_items || []);
                    setPhotos(data.completion.photos || []);
                    setNotes(data.completion.notes || "");
                }
            }
        } catch (error) {
            console.error("Failed to load completion:", error);
        }
    };

    const toggleItem = (step: string) => {
        setCompletedItems(prev => {
            const existing = prev.find(item => item.step === step);
            if (existing) {
                return prev.map(item =>
                    item.step === step
                        ? { ...item, completed: !item.completed, timestamp: new Date().toISOString() }
                        : item
                );
            } else {
                return [...prev, { step, completed: true, timestamp: new Date().toISOString() }];
            }
        });
    };

    const handlePhotoUpload = async (step: string, file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("booking_id", bookingId);
            formData.append("step", step);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setPhotos(prev => [
                    ...prev,
                    { step, url: data.url, uploaded_at: new Date().toISOString() },
                ]);
            }
        } catch (error) {
            console.error("Failed to upload photo:", error);
        } finally {
            setUploading(false);
        }
    };

    const saveProgress = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/checklists/${checklistId}/complete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    booking_id: bookingId,
                    completed_items: completedItems,
                    photos,
                    notes,
                }),
            });

            if (res.ok) {
                onComplete();
            }
        } catch (error) {
            console.error("Failed to save checklist:", error);
        } finally {
            setSaving(false);
        }
    };

    const completionPercentage = Math.round(
        (completedItems.filter(item => item.completed).length / items.length) * 100
    );

    const isItemCompleted = (step: string) => {
        return completedItems.find(item => item.step === step)?.completed || false;
    };

    const getPhotoForStep = (step: string) => {
        return photos.find(photo => photo.step === step);
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Progress Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">Service Checklist</h2>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-[#d4af37]">{completionPercentage}%</div>
                        <div className="text-sm text-gray-400">Complete</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#ff1744] to-[#d4af37]"
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercentage}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-4">
                {items
                    .sort((a, b) => a.order - b.order)
                    .map((item, index) => {
                        const completed = isItemCompleted(item.step);
                        const photo = getPhotoForStep(item.step);

                        return (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border ${completed ? "border-green-500/50" : "border-white/10"
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleItem(item.step)}
                                        className={`flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${completed
                                                ? "bg-green-500 border-green-500"
                                                : "border-white/30 hover:border-white/50"
                                            }`}
                                    >
                                        {completed && <Check className="text-white" size={20} />}
                                    </button>

                                    <div className="flex-1">
                                        {/* Step Info */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-sm font-semibold text-[#d4af37]">
                                                Step {item.order}
                                            </span>
                                            {item.required && (
                                                <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">
                                                    Required
                                                </span>
                                            )}
                                        </div>

                                        <h3 className={`text-lg font-medium mb-3 ${completed ? "text-white" : "text-gray-300"}`}>
                                            {item.step}
                                        </h3>

                                        {/* Photo Upload */}
                                        <div className="flex items-center gap-3">
                                            {photo ? (
                                                <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                                                    <Image
                                                        src={photo.url}
                                                        alt={item.step}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                        <CheckCircle2 className="text-green-400" size={24} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        capture="environment"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handlePhotoUpload(item.step, file);
                                                        }}
                                                        disabled={uploading}
                                                    />
                                                    <div className="w-24 h-24 border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center hover:border-white/50 transition-colors">
                                                        <Camera className="text-white/50 mb-1" size={24} />
                                                        <span className="text-xs text-white/50">Add Photo</span>
                                                    </div>
                                                </label>
                                            )}

                                            {uploading && (
                                                <div className="text-sm text-gray-400">Uploading...</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
            </div>

            {/* Notes */}
            <div className="mt-8">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Notes
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff1744] resize-none"
                    rows={4}
                    placeholder="Add any observations or issues..."
                />
            </div>

            {/* Save Button */}
            <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <AlertCircle size={16} />
                    <span>Progress is auto-saved</span>
                </div>

                <button
                    onClick={saveProgress}
                    disabled={saving || completionPercentage < 100}
                    className={`px-8 py-3 rounded-lg font-semibold transition-all ${completionPercentage === 100
                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg hover:shadow-green-500/50"
                            : "bg-white/10 text-gray-500 cursor-not-allowed"
                        }`}
                >
                    {saving ? "Saving..." : completionPercentage === 100 ? "Submit for Approval" : "Complete All Steps"}
                </button>
            </div>
        </div>
    );
}
