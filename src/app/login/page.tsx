"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Check,
  Loader2,
  Star,
  Sparkles,
  Zap,
  Globe,
  ChevronRight,
  ShieldCheck,
  Trophy,
  Fingerprint,
  Car,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/LanguageContext";

// --- Advanced Components ---

const GlassShards = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-50 lg:opacity-100">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, rotate: Math.random() * 360, scale: 0.5, x: Math.random() * 100 - 50 + "%", y: Math.random() * 100 - 50 + "%" }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1],
            x: [Math.random() * 100 - 50 + "%", Math.random() * 100 - 50 + "%", Math.random() * 100 - 50 + "%"],
            y: [Math.random() * 100 - 50 + "%", Math.random() * 100 - 50 + "%", Math.random() * 100 - 50 + "%"],
          }}
          transition={{ duration: 20 + Math.random() * 10, repeat: Infinity, ease: "linear" }}
          className="absolute w-64 h-64 bg-white/5 backdrop-blur-[1px] border border-white/5 rounded-3xl"
          style={{ clipPath: i % 2 === 0 ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : "polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)" }}
        />
      ))}
    </div>
  );
};

const BackgroundGradient = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#020202]">
    <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], x: ["-10%", "10%", "-10%"], y: ["-10%", "5%", "-10%"] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-[80%] h-[80%] bg-purple-600/10 rounded-full blur-[160px]" />
    <motion.div animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0], x: ["10%", "-10%", "10%"], y: ["10%", "-5%", "10%"] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 right-0 w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[160px]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
  </div>
);

const CarAnimation = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30 sm:opacity-50">
    {[...Array(2)].map((_, i) => (
      <motion.div key={i} initial={{ x: "-20%", y: `${30 + i * 40}%`, opacity: 0 }} animate={{ x: "120%", opacity: [0, 0.1, 0.1, 0] }} transition={{ duration: 15 + i * 5, repeat: Infinity, delay: i * 5, ease: "linear" }} className="absolute">
        <Car size={100} className="text-purple-500/10 fill-purple-500/5" />
      </motion.div>
    ))}
  </div>
);

const SuccessOverlay = ({ visible }: { visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center p-6">
          <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(16,185,129,0.5)]">
            <Check size={48} className="text-white stroke-[3]" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Nexus Sync</h2>
          <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-[0.2em]">Access Granted • Redirecting...</p>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const FloatingInput = ({ label, icon: Icon, type = "text", value, onChange, required = false, showPasswordToggle = false, onPasswordToggle = () => { }, isPasswordVisible = false, error = false, id }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const isFilled = value.length > 0;

  return (
    <div className="relative group w-full mb-4">
      <div className={`relative flex items-center bg-white/[0.02] border transition-all duration-300 rounded-[20px] overflow-hidden h-[60px] ${isFocused ? 'border-purple-500/50 bg-white/[0.05]' : 'border-white/5 hover:border-white/10'} ${error ? 'border-red-500/50' : ''}`}>
        <div className={`pl-5 transition-colors ${isFocused ? 'text-purple-400' : 'text-[#444]'}`}>
          <Icon size={18} />
        </div>
        <div className="relative flex-1 h-full px-4">
          <motion.label
            htmlFor={id}
            initial={false}
            animate={{ y: (isFocused || isFilled) ? -14 : 0, scale: (isFocused || isFilled) ? 0.75 : 1, color: isFocused ? "#a855f7" : "#555" }}
            className="absolute top-5 left-4 pointer-events-none origin-left font-black text-[10px] uppercase tracking-widest"
          >
            {label}
          </motion.label>
          <input id={id} type={type} value={value} onChange={onChange} required={required} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} className="w-full h-full bg-transparent pt-4 pb-1 text-sm font-bold text-white outline-none" autoComplete="off" />
        </div>
        {showPasswordToggle && (
          <button type="button" onClick={onPasswordToggle} className="pr-5 text-[#333] hover:text-white transition-colors">
            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

const PasswordScanner = ({ password }: { password: string }) => {
  const strength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const colors = ["bg-white/5", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"];
  return (
    <div className="mb-6 px-1">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[8px] font-black text-[#333] uppercase tracking-widest">Entropy Scan</span>
        <span className="text-[8px] font-black text-[#555] uppercase tracking-widest">
          {["IDLE", "WEAK", "FAIR", "STRONG", "SECURE"][strength]}
        </span>
      </div>
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div initial={false} animate={{ x: i <= strength ? "0%" : "-100%" }} className={`h-full ${colors[strength]}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, resetPassword, user, profile } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRotateX = useSpring(useTransform(mouseY, [-300, 300], [5, -5]), { damping: 20 });
  const cardRotateY = useSpring(useTransform(mouseX, [-300, 300], [-5, 5]), { damping: 20 });

  function handleMouseMove(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  }

  useEffect(() => {
    if (user && !isSuccess) router.push("/dashboard");
  }, [user, isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsError(false);

    try {
      if (isRecovery) {
        const { error } = await resetPassword(formData.email);
        if (error) throw new Error(error);
        toast.success("Recovery instructions dispatched.");
        setIsRecovery(false); setIsLogin(true);
      } else if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw new Error(error);
        setIsSuccess(true);
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.name);
        if (error) throw new Error(error);
        toast.success("Account initialized! Check your Nexus feed (email).");
        setIsSuccess(true);
        setTimeout(() => { setIsSuccess(false); setIsLogin(true); }, 1500);
      }
    } catch (err: any) {
      setIsError(true);
      toast.error(err.message || "Auth Failure: Vector blocked.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-x-hidden font-sans selection:bg-[#ff1744]/50">
      <BackgroundGradient />
      <GlassShards />
      <CarAnimation />
      <SuccessOverlay visible={isSuccess} />

      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
        style={{ rotateX: cardRotateX, rotateY: cardRotateY, perspective: 1000 }}
        className="relative z-10 w-full max-w-[440px] mt-8 lg:mt-0"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isRecovery ? "rec" : (isLogin ? "log" : "sig")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, x: isError ? [0, -5, 5, -5, 5, 0] : 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <div className="glass-card rounded-[40px] p-8 sm:p-12 border border-white/5 bg-zinc-900/40 backdrop-blur-3xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff1744] to-[#f50057] flex items-center justify-center shadow-lg shadow-[#ff1744]/20">
                      <Zap size={20} className="text-white fill-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tighter text-white">Shashti Karz</h2>
                    </div>
                  </div>
                  <button onClick={() => { setIsLogin(!isLogin); setIsRecovery(false); }} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#555] hover:text-white transition-all">
                    {isLogin || isRecovery ? "Sign Up" : "Secure Login"}
                  </button>
                </div>

                <div className="mb-10">
                  <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                    {isRecovery ? "Recovery." : (isLogin ? "Welcome." : "Initiate.")}
                  </h1>
                  <p className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em]">
                    {isRecovery ? "Nexus retrieval protocol engaged" : isLogin ? "Authorize terminal access" : "Establish new nexus credentials"}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {!isLogin && !isRecovery && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <FloatingInput id="name" label="Identity Reference" icon={User} value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} required />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <FloatingInput id="email" label="Nexus Vector (Email)" icon={Mail} type="email" value={formData.email} onChange={(e: any) => setFormData({ ...formData, email: e.target.value })} required />

                  {!isRecovery && (
                    <FloatingInput id="pass" label="Security Cipher" icon={Lock} type={showPassword ? "text" : "password"} value={formData.password} onChange={(e: any) => setFormData({ ...formData, password: e.target.value })} required showPasswordToggle isPasswordVisible={showPassword} onPasswordToggle={() => setShowPassword(!showPassword)} />
                  )}

                  {!isLogin && !isRecovery && <PasswordScanner password={formData.password} />}

                  {isLogin && (
                    <div className="flex justify-end pt-2 pb-6">
                      <button type="button" onClick={() => { setIsRecovery(true); setIsLogin(false); }} className="text-[10px] font-black text-[#333] hover:text-purple-400 uppercase tracking-widest transition-colors">
                        Recovery Protocol
                      </button>
                    </div>
                  )}

                  {isRecovery && (
                    <div className="flex justify-end pt-2 pb-6">
                      <button type="button" onClick={() => { setIsRecovery(false); setIsLogin(true); }} className="text-[10px] font-black text-[#333] hover:text-purple-400 uppercase tracking-widest transition-colors">
                        Back to Login
                      </button>
                    </div>
                  )}

                  <button disabled={isLoading} className="w-full btn-premium py-4.5 rounded-2xl text-white font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-[#ff1744]/20 transition-all hover:scale-[1.02] disabled:opacity-50 mt-4">
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : (isRecovery ? "Deploy Recovery" : isLogin ? "Enter Nexus" : "Join Shashti")}
                    {!isLoading && <ArrowRight size={16} />}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Mobile-Friendly Bottom Info */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-8 opacity-40">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-purple-500" />
          <span className="text-[8px] font-black uppercase tracking-widest">AES-256 SECURED</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-blue-500" />
          <span className="text-[8px] font-black uppercase tracking-widest">REALTIME SYNC</span>
        </div>
      </div>
    </main>
  );
}
