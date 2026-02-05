"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Shield, Search, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function AdminLoginPage() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/admin/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const data = await response.json();

            if (response.ok) {
                router.push("/admin");
                router.refresh();
            } else {
                setError(data.error || "Invalid Cipher Vector");
            }
        } catch (err) {
            setError("Connection protocol breach. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020202] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-[#ff1744]/50">
            {/* Background elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-[#ff1744]/5 rounded-full blur-[160px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[80%] h-[80%] bg-blue-600/5 rounded-full blur-[160px] animate-pulse delay-1000" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-[400px]"
            >
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#0a0a0a] border border-white/5 mb-6 shadow-2xl shadow-[#ff1744]/30 relative overflow-hidden">
                        <Image
                            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/ChatGPT-Image-Dec-8-2025-10_12_14-AM-1-1768823187171.png?width=200&height=200&resize=contain"
                            alt="Logo"
                            width={56}
                            height={56}
                            className="w-14 h-14 object-contain relative z-10"
                        />
                        <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 bg-white/5 -skew-x-12" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">Admin Lexicon</h1>
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#555]">Secure Sector Authorization</p>
                    </div>
                </div>

                <div className="glass-card rounded-[3rem] p-8 sm:p-10 border border-white/5 bg-zinc-900/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#333] ml-1">Terminal Cipher</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#444] group-focus-within:text-[#ff1744] transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-14 pr-12 py-5 bg-white/[0.02] border border-white/5 rounded-2xl text-white font-bold text-sm tracking-widest placeholder-[#222] outline-none focus:border-[#ff1744]/50 focus:bg-white/[0.05] transition-all"
                                    placeholder="••••••••"
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-[#222] hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                                    <Shield className="text-red-500" size={14} />
                                    <p className="text-[10px] font-black uppercase text-red-500">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full btn-premium py-5 rounded-2xl text-white font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-[#ff1744]/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : "Authorize Entry"}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>
                </div>

                <div className="mt-10 flex flex-col items-center gap-6">
                    <a href="/" className="text-[10px] font-black uppercase tracking-widest text-[#333] hover:text-white transition-colors flex items-center gap-2">
                        ← Exit to Public Domain
                    </a>
                    <div className="flex items-center gap-2 opacity-30">
                        <Sparkles size={12} className="text-purple-500" />
                        <span className="text-[8px] font-black uppercase tracking-[0.4em]">Proprietary OS v4.2</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
