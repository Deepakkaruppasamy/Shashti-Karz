"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    Upload, Image as ImageIcon, Video, X, Car,
    Tag, Hash, Trophy, Info, Camera, Loader2
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

function UploadForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const contestId = searchParams.get("contest");
    const { user } = useAuth();
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<"photo" | "video">("photo");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        vehicle_id: "",
        service_type: "",
        car_model: "",
        hashtags: "",
        contest_id: contestId || ""
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (file.type.startsWith("image/")) {
            setMediaType("photo");
        } else if (file.type.startsWith("video/")) {
            setMediaType("video");
        } else {
            toast.error("Please upload an image or video file");
            return;
        }

        // Validate file size (e.g., 50MB limit)
        if (file.size > 50 * 1024 * 1024) {
            toast.error("File size must be less than 50MB");
            return;
        }

        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !mediaFile) return;

        setIsLoading(true);

        try {
            // 1. Upload file to Supabase Storage
            const fileExt = mediaFile.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const bucket = "showroom-media";

            // Check if bucket exists, if not use a fallback or public URL for demo
            // In a real app, ensure 'showroom-media' bucket exists
            const { error: uploadError, data: uploadData } = await supabase.storage
                .from(bucket)
                .upload(fileName, mediaFile);

            let mediaUrl = "";

            if (uploadError) {
                console.error("Storage upload error:", uploadError);
                // Fallback for demo if storage isn't set up: use a placeholder or previous logic
                // For now, we'll optimistically assume success or catch the error
                throw new Error("Failed to upload media. Please try again.");
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(fileName);
                mediaUrl = publicUrl;
            }

            // 2. Create Post Record
            const hashtagsArray = formData.hashtags
                .split(" ")
                .filter(tag => tag.startsWith("#"))
                .map(tag => tag.replace("#", ""));

            const { error: dbError } = await supabase
                .from("showroom_posts")
                .insert({
                    user_id: user.id,
                    title: formData.title,
                    description: formData.description,
                    media_type: mediaType,
                    media_url: mediaUrl,
                    vehicle_id: formData.vehicle_id || null, // Optional
                    service_type: formData.service_type || null,
                    car_model: formData.car_model,
                    contest_id: formData.contest_id || null,
                    contest_entry: !!formData.contest_id,
                    hashtags: hashtagsArray,
                    status: "pending" // Auto-approve could be enabled for trusted users
                });

            if (dbError) throw dbError;

            toast.success("Post uploaded successfully! Pending moderation.");
            router.push("/showroom");

        } catch (error: any) {
            console.error("Upload failed:", error);
            toast.error(error.message || "Failed to create post");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-card rounded-2xl p-6 sm:p-8">
            <div className="grid lg:grid-cols-2 gap-12">
                {/* Left Column: Media Upload */}
                <div>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`aspect-[4/5] rounded-2xl border-2 border-dashed border-white/10 hover:border-[#ff1744]/50 transition-colors flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group ${!mediaPreview ? 'bg-white/5' : ''}`}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                        />

                        {mediaPreview ? (
                            <>
                                {mediaType === 'photo' ? (
                                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <video src={mediaPreview} className="w-full h-full object-cover" controls />
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full font-medium flex items-center gap-2">
                                        <Camera size={20} />
                                        Change Media
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-8">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-[#ff1744]">
                                    <Upload size={32} />
                                </div>
                                <h3 className="text-lg font-medium mb-2">Upload Photo or Video</h3>
                                <p className="text-sm text-[#888] mb-6">Values transformation by showing before/after results.</p>
                                <div className="flex gap-4 justify-center text-xs text-[#666]">
                                    <span className="flex items-center gap-1"><ImageIcon size={14} /> PNG, JPG</span>
                                    <span className="flex items-center gap-1"><Video size={14} /> MP4, MOV</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Details Form */}
                <form onSubmit={handleUpload} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-[#888]">Title</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., Ceramic Coating on my BMW M4"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#ff1744] outline-none transition-colors"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-[#888]">Description</label>
                        <textarea
                            rows={4}
                            placeholder="Tell us about the process, products used, or the result..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#ff1744] outline-none transition-colors resize-none"
                        />
                    </div>

                    {/* Car Model */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-[#888]">Car Model</label>
                        <div className="relative">
                            <Car size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666]" />
                            <input
                                type="text"
                                required
                                placeholder="e.g., BMW M4 Competition"
                                value={formData.car_model}
                                onChange={e => setFormData({ ...formData, car_model: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[#ff1744] outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Contest Selection (Optional) */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-[#888]">Enter Contest (Optional)</label>
                        <div className="relative">
                            <Trophy size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37]" />
                            <select
                                value={formData.contest_id}
                                onChange={e => setFormData({ ...formData, contest_id: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[#ff1744] outline-none transition-colors appearance-none cursor-pointer"
                            >
                                <option value="">No Contest Entry</option>
                                {/* Ideally fetch active contests here */}
                                <option value="feb-2026-detail">Detail of the Month (Feb 2026)</option>
                            </select>
                        </div>
                        {formData.contest_id && (
                            <p className="text-xs text-[#d4af37] mt-2 flex items-center gap-1">
                                <Info size={12} />
                                Win 1000 points if selected!
                            </p>
                        )}
                    </div>

                    {/* Hashtags */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-[#888]">Hashtags</label>
                        <div className="relative">
                            <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666]" />
                            <input
                                type="text"
                                placeholder="#ceramic #detailing #shine"
                                value={formData.hashtags}
                                onChange={e => setFormData({ ...formData, hashtags: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-[#ff1744] outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading || !mediaFile}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={24} className="animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload size={24} />
                                    Post Transformation
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-[#666] mt-4">
                            By uploading, you agree to our content guidelines. Posts are subject to moderation.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ShowroomUploadPage() {
    return (
        <main className="min-h-screen bg-[#0a0a0a]">
            <Navbar />

            <div className="pt-24 pb-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Upload to Showroom</h1>
                        <p className="text-[#888]">Share your detailing transformation with the community.</p>
                    </div>

                    <Suspense fallback={
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="animate-spin text-[#ff1744]" size={32} />
                        </div>
                    }>
                        <UploadForm />
                    </Suspense>
                </div>
            </div>

            <Footer />
        </main>
    );
}
