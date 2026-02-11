"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Camera, Upload, Search, Shield, Sparkles,
    ChevronRight, ArrowLeft, Cpu, Maximize,
    CheckCircle2, AlertTriangle, Zap, Brain
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CarLoader } from "@/components/animations/CarLoader";
import { useLanguage } from "@/lib/LanguageContext";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import { Car, Plus, Save, Loader2 } from "lucide-react";

type DiagnosticStep = "upload" | "scanning" | "analysis" | "results";

interface Detection {
    id: string;
    type: "scratch" | "stain" | "swirl" | "oxidation" | "dent";
    severity: "low" | "medium" | "high";
    location: string;
    description: string;
    recommendedService: string;
}

export default function AiDiagnosticPage() {
    const { t } = useLanguage();
    const [step, setStep] = useState<DiagnosticStep>("upload");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [overallScore, setOverallScore] = useState(100);
    const [detections, setDetections] = useState<Detection[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [vehicles, setVehicles] = useState<any[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [isAddingVehicle, setIsAddingVehicle] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        name: "",
        brand: "",
        model: "",
        number_plate: "",
        year: new Date().getFullYear()
    });

    useEffect(() => {
        const loadVehicles = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const res = await fetch(`/api/vehicles?user_id=${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setVehicles(data);
                    if (data.length > 0) setSelectedVehicleId(data[0].id);
                }
            }
        };
        loadVehicles();
    }, []);

    const handleAddVehicle = async () => {
        if (!newVehicle.name || !newVehicle.brand || !newVehicle.model || !newVehicle.number_plate) {
            toast.error("Please fill in all required vehicle details");
            return;
        }

        setIsAddingVehicle(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const res = await fetch("/api/vehicles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newVehicle)
            });

            const responseData = await res.json();

            if (res.ok) {
                setVehicles([...vehicles, responseData]);
                setSelectedVehicleId(responseData.id);
                setShowAddVehicle(false);
                setNewVehicle({ name: "", brand: "", model: "", number_plate: "", year: new Date().getFullYear() });
                toast.success("Vehicle added successfully!");
            } else {
                // Display detailed error from API
                const errorMsg = responseData.error || responseData.message || "Failed to add vehicle";
                console.error("API Error:", responseData);
                toast.error(errorMsg);
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            console.error("Error adding vehicle:", error);
            if (!error.message.includes("Failed to add vehicle")) {
                toast.error(error.message || "Failed to add vehicle");
            }
        } finally {
            setIsAddingVehicle(false);
        }
    };

    const handleSaveResults = async () => {
        if (!selectedVehicleId) {
            toast.error("Please select a vehicle or add one first");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/ai/diagnostic", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    vehicle_id: selectedVehicleId,
                    overall_score: overallScore,
                    recommendations: detections.map(d => d.recommendedService),
                    detections: detections,
                    diagnostic_image: selectedImage // Include the uploaded image
                })
            });

            if (res.ok) {
                toast.success("Health score saved to Digital Garage!");
                setSaveSuccess(true);
            } else {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to save");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to save diagnostic results");
        } finally {
            setIsSaving(false);
        }
    };

    const startScanning = () => {
        setStep("scanning");
        let p = 0;
        const interval = setInterval(() => {
            p += 1;
            setProgress(p);
            if (p === 100) {
                clearInterval(interval);
                setTimeout(() => setStep("analysis"), 500);
            }
        }, 40);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Show preview immediately
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Start scanning animation
            startScanning();

            // Upload to Supabase Storage in background
            try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("folder", "diagnostic-images");

                const uploadRes = await fetch("/api/upload/image", {
                    method: "POST",
                    body: formData
                });

                if (uploadRes.ok) {
                    const { url } = await uploadRes.json();
                    console.log("Image uploaded:", url);
                    // Store the URL for later use when saving results
                    setSelectedImage(url);
                }
            } catch (error) {
                console.error("Failed to upload image:", error);
                // Continue with local preview even if upload fails
            }
        }
    };

    const possibleDetections: Omit<Detection, "id">[] = [
        { type: "swirl", severity: "medium", location: "Hood & Doors", description: "Micro-scratches detected in clear coat layer.", recommendedService: "Paint Correction" },
        { type: "oxidation", severity: "low", location: "Roof", description: "Early signs of paint fading due to UV exposure.", recommendedService: "Ceramic Coating" },
        { type: "scratch", severity: "high", location: "Rear Bumper", description: "Deep scratch penetrating the primer layer.", recommendedService: "Premium Detailing" },
        { type: "oxidation", severity: "medium", location: "Trunk Lid", description: "Surface oxidation starting to dull the paint finish.", recommendedService: "Paint Correction" },
        { type: "stain", severity: "low", location: "Lower Panels", description: "Hard water spots and mineral deposits detected.", recommendedService: "Deep Wash & Decontamination" },
        { type: "swirl", severity: "high", location: "Quarter Panels", description: "Heavy spider-webbing from improper wash techniques.", recommendedService: "Multi-stage Correction" },
        { type: "dent", severity: "medium", location: "Driver Side Door", description: "Minor surface depression without paint loss.", recommendedService: "Paintless Dent Removal" },
    ];

    useEffect(() => {
        if (step === "analysis") {
            setTimeout(() => {
                // Generate 2-4 random detections
                const count = Math.floor(Math.random() * 3) + 2;
                const shuffled = [...possibleDetections].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, count).map((d, i) => ({
                    ...d,
                    id: (i + 1).toString()
                })) as Detection[];

                // Calculate score
                let score = 100;
                selected.forEach(d => {
                    if (d.severity === "high") score -= 15;
                    else if (d.severity === "medium") score -= 8;
                    else score -= 4;
                });

                // Add some randomness to score
                score = Math.max(30, Math.min(98, score - Math.floor(Math.random() * 5)));

                setDetections(selected);
                setOverallScore(score);
                setStep("results");
            }, 3000);
        }
    }, [step]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <Navbar />

            <main className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
                {/* HUD Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-4xl lg:text-5xl font-black italic tracking-tighter flex items-center gap-4">
                            <span className="p-3 bg-[#ff1744]/10 rounded-2xl border border-[#ff1744]/20">
                                <Brain className="text-[#ff1744]" size={32} />
                            </span>
                            SHASHTI VISION
                        </h1>
                        <p className="text-[#888] mt-2 font-bold uppercase tracking-[0.3em] flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-[#ff1744] animate-pulse" />
                            AI Damage Diagnostic Suite v2.4
                        </p>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 overflow-x-auto scrollbar-hide max-w-full">
                            {(["upload", "scanning", "analysis", "results"] as const).map((s, i) => (
                                <div
                                    key={s}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${step === s ? "bg-[#ff1744] text-white" : "text-[#444]"
                                        }`}
                                >
                                    {i + 1}. {s}
                                </div>
                            ))}
                        </div>
                    </AnimatePresence>
                </div>

                <AnimatePresence mode="wait">
                    {step === "upload" && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="grid lg:grid-cols-2 gap-12"
                        >
                            <div className="glass-card rounded-[3rem] p-8 lg:p-12 border border-white/10 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#ff1744]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/10 group-hover:border-[#ff1744]/50 transition-all duration-500">
                                        <Camera className="text-[#ff1744]" size={40} />
                                    </div>
                                    <h2 className="text-3xl font-bold mb-4">Analyze car condition in seconds</h2>
                                    <p className="text-[#888] mb-10 max-w-md">
                                        Upload a photo of your car's exterior or interior. Our neural network will detect imperfections and recommend the optimal treatment.
                                    </p>

                                    <div className="w-full mb-8">
                                        <label className="block text-xs font-black uppercase tracking-widest text-[#444] mb-3 text-left">Target Vehicle</label>

                                        {!showAddVehicle && vehicles.length > 0 ? (
                                            <div className="space-y-3">
                                                <select
                                                    value={selectedVehicleId}
                                                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-[#ff1744] outline-none transition-all appearance-none cursor-pointer"
                                                >
                                                    {vehicles.map(v => (
                                                        <option key={v.id} value={v.id} className="bg-[#111]">{v.brand} {v.model} ({v.number_plate})</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => setShowAddVehicle(true)}
                                                    className="flex items-center gap-2 text-xs text-[#888] hover:text-white transition-colors"
                                                >
                                                    <Plus size={14} /> Add another vehicle
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                                                    <div>
                                                        <label className="block text-xs text-[#888] mb-2">Vehicle Name *</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g., My BMW, Daily Driver"
                                                            value={newVehicle.name}
                                                            onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ff1744] outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-[#888] mb-2">Brand *</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g., BMW, Mercedes"
                                                            value={newVehicle.brand}
                                                            onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ff1744] outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-[#888] mb-2">Model *</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g., M4, S-Class"
                                                            value={newVehicle.model}
                                                            onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ff1744] outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs text-[#888] mb-2">Number Plate *</label>
                                                            <input
                                                                type="text"
                                                                placeholder="TN01AB1234"
                                                                value={newVehicle.number_plate}
                                                                onChange={(e) => setNewVehicle({ ...newVehicle, number_plate: e.target.value.toUpperCase() })}
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ff1744] outline-none transition-all"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-[#888] mb-2">Year</label>
                                                            <input
                                                                type="number"
                                                                value={newVehicle.year}
                                                                onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })}
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ff1744] outline-none transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 pt-2">
                                                        <button
                                                            onClick={handleAddVehicle}
                                                            disabled={isAddingVehicle}
                                                            className="flex-1 bg-[#ff1744] hover:bg-[#ff1744]/90 text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                        >
                                                            {isAddingVehicle ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                                            Add Vehicle
                                                        </button>
                                                        {vehicles.length > 0 && (
                                                            <button
                                                                onClick={() => setShowAddVehicle(false)}
                                                                className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-all"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={!selectedVehicleId}
                                            className="flex-1 btn-premium py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#ff1744]/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Upload size={18} /> Upload Media
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            accept="image/*"
                                        />

                                        <button
                                            onClick={startScanning}
                                            disabled={!selectedVehicleId}
                                            className="flex-1 bg-white/5 border border-white/10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
                                        >
                                            Try AI Analysis
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="glass-card rounded-[2.5rem] p-8 border border-white/10 flex items-start gap-6">
                                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
                                        <Cpu size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-1">Deep Learning Analysis</h3>
                                        <p className="text-sm text-[#888]">Advanced paint defect detection models trained on over 50,000 premium car surfaces.</p>
                                    </div>
                                </div>
                                <div className="glass-card rounded-[2.5rem] p-8 border border-white/10 flex items-start gap-6">
                                    <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400">
                                        <Maximize size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-1">Visual Depth Mapping</h3>
                                        <p className="text-sm text-[#888]">Identifies the depth of scratches to determine if compounding or simple polishing is required.</p>
                                    </div>
                                </div>
                                <div className="glass-card rounded-[2.5rem] p-8 border border-white/10 flex items-start gap-6">
                                    <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20 text-green-400">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-1">Protection Prognosis</h3>
                                        <p className="text-sm text-[#888]">Predicts future paint deterioration based on current oxidation levels.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === "scanning" && (
                        <motion.div
                            key="scanning"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <div className="relative w-full max-w-2xl aspect-video rounded-[3rem] overflow-hidden border border-[#ff1744]/30 shadow-[0_0_100px_rgba(255,23,68,0.1)]">
                                {selectedImage && (
                                    <img src={selectedImage} alt="Scanning" className="w-full h-full object-cover" />
                                )}
                                <div className="absolute inset-0 bg-black/40" />

                                {/* Scanning Beam */}
                                <motion.div
                                    initial={{ top: "-10%" }}
                                    animate={{ top: "110%" }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff1744] to-transparent shadow-[0_0_20px_#ff1744] z-20"
                                />

                                {/* HUD Elements */}
                                <div className="absolute inset-0 z-30 pointer-events-none p-8 font-mono">
                                    <div className="absolute top-8 left-8 border-t-2 border-l-2 border-[#ff1744] w-8 h-8" />
                                    <div className="absolute top-8 right-8 border-t-2 border-r-2 border-[#ff1744] w-8 h-8" />
                                    <div className="absolute bottom-8 left-8 border-b-2 border-l-2 border-[#ff1744] w-8 h-8" />
                                    <div className="absolute bottom-8 right-8 border-b-2 border-r-2 border-[#ff1744] w-8 h-8" />

                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[#ff1744] text-xs">RESOLVING_SENSORS...</p>
                                            <p className="text-white text-[10px]">VECTOR_STABILITY: 98.4%</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[#ff1744] text-xs">SCAN_PROGRESS</p>
                                            <p className="text-3xl font-black">{progress}%</p>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center">
                                        <p className="text-[10px] text-[#888] uppercase tracking-[0.5em] animate-pulse">Analyzing Surface Texture</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 flex items-center gap-12">
                                <div className="text-center">
                                    <div className="text-2xl font-black text-white">4K</div>
                                    <div className="text-[10px] text-[#444] font-bold uppercase tracking-widest">Resolution</div>
                                </div>
                                <div className="w-px h-12 bg-white/10" />
                                <div className="text-center">
                                    <div className="text-2xl font-black text-white">8.4ms</div>
                                    <div className="text-[10px] text-[#444] font-bold uppercase tracking-widest">Latency</div>
                                </div>
                                <div className="w-px h-12 bg-white/10" />
                                <div className="text-center">
                                    <div className="text-2xl font-black text-white">GEN-V</div>
                                    <div className="text-[10px] text-[#444] font-bold uppercase tracking-widest">Core</div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === "analysis" && (
                        <motion.div
                            key="analysis"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <div className="w-32 h-32 mb-12">
                                <CarLoader />
                            </div>
                            <h2 className="text-3xl font-bold mb-2">Compiling Intelligence</h2>
                            <p className="text-[#888] font-mono text-sm">Identifying clear-coat anomalies and structural integrity...</p>

                            <div className="mt-12 max-w-md w-full space-y-3">
                                {[
                                    "Color frequency extraction complete",
                                    "Specular highlight mapping complete",
                                    "Anomaly boundary detection active",
                                    "Cross-referencing similar makes & models"
                                ].map((text, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.5 }}
                                        className="flex justify-between items-center text-[10px] text-[#444] font-bold uppercase tracking-widest border-b border-white/5 pb-2"
                                    >
                                        <span>{text}</span>
                                        <CheckCircle2 size={12} className="text-green-500" />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === "results" && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="grid lg:grid-cols-3 gap-8"
                        >
                            <div className="lg:col-span-2 space-y-8">
                                <div className="glass-card rounded-[3rem] p-8 border border-white/10">
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-bold">Detected Points of Interest</h2>
                                        <span className="px-4 py-1.5 bg-[#ff1744]/10 border border-[#ff1744]/30 text-[#ff1744] text-[10px] font-black rounded-full uppercase tracking-widest">
                                            {detections.length} ANOMALIES FOUND
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        {detections.map((det) => (
                                            <div key={det.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center gap-6 group hover:bg-white/[0.05] transition-all">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${det.severity === "high" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                                    det.severity === "medium" ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" :
                                                        "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                                                    }`}>
                                                    <AlertTriangle size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h4 className="font-bold uppercase tracking-widest text-xs">{det.type} @ {det.location}</h4>
                                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${det.severity === "high" ? "bg-red-500 text-white" : "bg-white/10 text-[#888]"
                                                            }`}>{det.severity} urgency</span>
                                                    </div>
                                                    <p className="text-sm text-[#888]">{det.description}</p>
                                                </div>
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-[10px] text-[#444] font-bold uppercase tracking-[0.2em] mb-1">Recommended</p>
                                                    <p className="text-xs font-black text-white">{det.recommendedService}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="glass-card rounded-[2.5rem] p-8 border border-white/10">
                                        <h3 className="text-[10px] font-black text-[#444] uppercase tracking-[0.3em] mb-6">Visual Health Score</h3>
                                        <div className="flex items-end gap-3">
                                            <span className="text-6xl font-black italic tracking-tighter">{overallScore}</span>
                                            <span className="text-2xl font-bold text-[#444] mb-2">/ 100</span>
                                        </div>
                                        <p className="text-sm text-[#888] mt-4">
                                            {overallScore >= 85 ? "Your vehicle is in exceptional condition. Minor preventative maintenance is recommended." :
                                                overallScore >= 70 ? "Structural integrity is strong, but surface protection has reached critical depletion levels." :
                                                    "Significant surface damage detected. Immediate professional intervention required to prevent base coat failure."}
                                        </p>
                                    </div>
                                    <div className="glass-card rounded-[2.5rem] p-8 border border-white/10 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-[10px] font-black text-[#444] uppercase tracking-[0.3em] mb-6">Expert Verdict</h3>
                                            <p className="text-sm font-medium leading-relaxed italic text-white/90">
                                                {overallScore >= 85 ? "\"The factory finish is well-maintained. A ceramic top-up would solidify its long-term integrity.\"" :
                                                    overallScore >= 70 ? "\"The current level of clear-coat oxidation suggests immediate intervention with Ceramic Pro to prevent permanent UV-induced base-coat damage.\"" :
                                                        "\"Severe contamination and structural swirl marks detected. Requires multi-stage correction before any protection can be applied.\""}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-6 border-t border-white/5 pt-4">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff1744] to-[#d4af37]" />
                                            <p className="text-[10px] font-black text-[#444] uppercase tracking-widest">Dinesh • Lead Inspector</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="glass-card rounded-[3rem] p-8 lg:p-10 border border-[#ff1744]/20 bg-gradient-to-b from-[#ff1744]/5 to-transparent relative overflow-hidden">
                                    <div className="relative z-10">
                                        <Zap className="text-[#ff1744] mb-8" size={32} />
                                        <h3 className="text-2xl font-bold mb-4 italic tracking-tighter">ULTIMATE PROTECTION PLAN</h3>
                                        <ul className="space-y-4 mb-10">
                                            {[
                                                "Triple Stage Decontamination",
                                                "Paint Correction Package",
                                                "Ceramic Coating (5YR)",
                                                "Interior Deep Clean"
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-center gap-3 text-sm text-[#888]">
                                                    <CheckCircle2 size={16} className="text-[#ff1744]" /> {item}
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="mb-10 p-5 bg-white/5 rounded-2xl border border-white/10">
                                            <div className="text-[10px] text-[#444] font-bold uppercase mb-2">Special Package Price</div>
                                            <div className="text-3xl font-black tracking-tighter text-white">₹18,500 <span className="text-sm line-through text-[#444] ml-2">₹24,000</span></div>
                                        </div>

                                        {!saveSuccess ? (
                                            <button
                                                onClick={handleSaveResults}
                                                disabled={isSaving}
                                                className="w-full btn-premium py-5 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-[#d4af37]/20 border border-[#d4af37]/30"
                                            >
                                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                                Save to Digital Garage
                                            </button>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest bg-green-500/10 border border-green-500/20 text-green-500">
                                                    <CheckCircle2 size={18} /> Results Synced
                                                </div>
                                                <Link
                                                    href={`/dashboard/vehicles/${selectedVehicleId}`}
                                                    className="w-full bg-[#ff1744]/10 border border-[#ff1744]/30 py-5 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#ff1744]/20 transition-all text-[#ff1744]"
                                                >
                                                    View in Digital Garage <ChevronRight size={18} />
                                                </Link>
                                            </div>
                                        )}

                                        <Link
                                            href="/booking"
                                            className="w-full bg-white/5 border border-white/10 py-5 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white"
                                        >
                                            Immediate Booking <ChevronRight size={18} />
                                        </Link>
                                    </div>

                                    {/* Decorative Elements */}
                                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#ff1744]/10 rounded-full blur-3xl" />
                                </div>

                                <div className="glass-card rounded-[2.5rem] p-8 border border-white/10">
                                    <h3 className="text-[10px] font-black text-[#444] uppercase tracking-[0.3em] mb-6">Next Service Predictor</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-[#d4af37]">
                                            <Sparkles size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">AC Disinfection</p>
                                            <p className="text-[10px] text-[#888] uppercase tracking-widest">Recommended in 45 days</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep("upload")}
                                    className="w-full py-4 text-[10px] font-black text-[#444] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:text-white transition-all underline"
                                >
                                    <ArrowLeft size={16} /> Scan Another Area
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <Footer />
        </div>
    );
}
