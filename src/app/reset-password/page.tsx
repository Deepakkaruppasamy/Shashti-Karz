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
  Check
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

// Reusing some components from login for consistency
const BackgroundGradient = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#020202]">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          x: ["-10%", "10%", "-10%"],
          y: ["-10%", "5%", "-10%"],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-0 w-[80%] h-[80%] bg-purple-600/10 rounded-full blur-[160px]"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
    </div>
  );
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setIsSuccess(true);
      toast.success("Password updated successfully");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <BackgroundGradient />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="backdrop-blur-3xl bg-zinc-900/40 border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Zap size={20} className="text-white fill-white" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Shashti Karz</h2>
          </div>

          <div className="mb-10">
            <h1 className="text-4xl font-bold text-white mb-4">New Cipher.</h1>
            <p className="text-zinc-400">Establish a new security key for your account.</p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-purple-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-purple-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 transition-all"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>Update Cipher</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                <Check size={40} className="text-white stroke-[3]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Success</h3>
              <p className="text-zinc-400">Your security protocol has been updated. Redirecting to login...</p>
            </motion.div>
          )}

          <div className="mt-12 flex items-center justify-center gap-2 text-zinc-500">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Quantum Encrypted</span>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
