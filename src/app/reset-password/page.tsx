"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Zap,
  ShieldCheck,
  Check,
  TrendingUp,
  Fingerprint
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

const BackgroundGradient = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#020202]">
    <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], x: ["-10%", "10%", "-10%"], y: ["-10%", "5%", "-10%"] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-[80%] h-[80%] bg-[#ff1744]/5 rounded-full blur-[160px]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
  </div>
);

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error("Cipher mismatch");
    if (password.length < 6) return toast.error("Cipher payload too small (min 6)");

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setIsSuccess(true);
      toast.success("Cipher updated successfully");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to update security vector");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-white selection:bg-[#ff1744]/50">
      <BackgroundGradient />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-[420px]">
        <div className="glass-card rounded-[3rem] p-8 sm:p-12 border border-white/5 bg-zinc-900/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff1744] to-[#f50057] flex items-center justify-center shadow-lg shadow-[#ff1744]/20">
                <Zap size={20} className="text-white fill-white" />
              </div>
              <h2 className="text-lg font-black tracking-tighter uppercase text-white">Shashti Karz</h2>
            </div>

            <div className="mb-10">
              <h1 className="text-4xl font-black text-white tracking-tighter mb-2">New Cipher.</h1>
              <p className="text-[10px] font-black uppercase text-[#555] tracking-[0.2em]">Redefine your security vector</p>
            </div>

            {!isSuccess ? (
              <form onSubmit={handleReset} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#444] group-focus-within:text-[#ff1744] transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="NEW CIPHER"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-14 pr-12 text-sm font-bold placeholder-[#222] outline-none focus:border-[#ff1744]/50 focus:bg-white/[0.05] transition-all tracking-widest"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-5 flex items-center text-[#222] hover:text-white transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#444] group-focus-within:text-[#ff1744] transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="CONFIRM VECTOR"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-14 pr-4 text-sm font-bold placeholder-[#222] outline-none focus:border-[#ff1744]/50 focus:bg-white/[0.05] transition-all tracking-widest"
                    />
                  </div>
                </div>

                <button disabled={isLoading} className="w-full btn-premium py-5 rounded-2xl text-white font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-[#ff1744]/20 transition-all hover:scale-[1.02] disabled:opacity-50 mt-8">
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Update Security Layer"}
                  {!isLoading && <ArrowRight size={18} />}
                </button>
              </form>
            ) : (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                  <Check size={40} className="text-white stroke-[3]" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Sync Complete</h3>
                <p className="text-[10px] font-black uppercase text-[#555] tracking-widest leading-relaxed">Security protocol updated. Redirecting to Entry Terminal...</p>
              </motion.div>
            )}

            <div className="mt-12 flex items-center justify-center gap-2 opacity-30">
              <ShieldCheck size={14} className="text-purple-500" />
              <span className="text-[8px] font-black uppercase tracking-[0.4em]">Proprietary OS v4.2</span>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
