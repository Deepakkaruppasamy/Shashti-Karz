"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
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
  Car
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/LanguageContext";

// --- Advanced Components ---

const GlassShards = () => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 0, 
            rotate: Math.random() * 360,
            scale: 0.5,
            x: Math.random() * 100 - 50 + "%",
            y: Math.random() * 100 - 50 + "%"
          }}
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1],
            x: [
              Math.random() * 100 - 50 + "%", 
              Math.random() * 100 - 50 + "%", 
              Math.random() * 100 - 50 + "%"
            ],
            y: [
              Math.random() * 100 - 50 + "%", 
              Math.random() * 100 - 50 + "%", 
              Math.random() * 100 - 50 + "%"
            ],
          }}
          transition={{
            duration: 20 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute w-64 h-64 bg-white/5 backdrop-blur-[1px] border border-white/5 rounded-3xl"
          style={{
            clipPath: i % 2 === 0 
              ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" 
              : "polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)"
          }}
        />
      ))}
    </div>
  );
};

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
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-0 left-0 w-[80%] h-[80%] bg-purple-600/10 rounded-full blur-[160px]"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [0, -90, 0],
          x: ["10%", "-10%", "10%"],
          y: ["10%", "-5%", "10%"],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-0 right-0 w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[160px]"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
    </div>
  );
};

const CarAnimation = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: "-20%", y: `${20 + i * 30}%`, opacity: 0, scale: 0.8 }}
          animate={{ 
            x: "120%", 
            opacity: [0, 0.2, 0.2, 0],
            scale: [0.8, 1, 1, 0.8]
          }}
          transition={{
            duration: 10 + i * 5,
            repeat: Infinity,
            delay: i * 4,
            ease: "linear",
          }}
          className="absolute"
        >
          <div className="relative">
            <Car size={120} className="text-purple-500/10 fill-purple-500/5" />
            <motion.div 
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-1/2 -right-4 w-12 h-4 bg-purple-500/20 blur-xl rounded-full"
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const SuccessOverlay = ({ visible }: { visible: boolean }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="text-center"
          >
            <div className="relative inline-block mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)]"
              >
                <Check size={48} className="text-white stroke-[3]" />
              </motion.div>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0, 1, 0.5],
                    x: Math.cos(i * 30 * Math.PI / 180) * 80,
                    y: Math.sin(i * 30 * Math.PI / 180) * 80,
                  }}
                  transition={{ duration: 1, delay: 0.4 }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-emerald-400"
                />
              ))}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Authenticated</h2>
            <p className="text-emerald-400/80 font-medium">Entering the Shashti Karz Ecosystem...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const FloatingInput = ({ 
  label, 
  icon: Icon, 
  type = "text", 
  value, 
  onChange, 
  required = false,
  showPasswordToggle = false,
  onPasswordToggle = () => {},
  isPasswordVisible = false,
  error = false,
  id
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const isFilled = value.length > 0;

  return (
    <div className="relative group w-full mb-6">
      <div className={`absolute -inset-[1px] bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-purple-500/30 rounded-2xl blur-sm transition-opacity duration-500 ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
      
      <div className={`relative flex items-center bg-[#0a0a0a]/80 border backdrop-blur-md transition-all duration-300 rounded-2xl overflow-hidden h-[64px] ${isFocused ? 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'border-zinc-800/80 hover:border-zinc-700/80'} ${error ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : ''}`}>
        <div className={`pl-5 transition-colors duration-300 ${isFocused ? 'text-purple-400' : isFilled ? 'text-zinc-300' : 'text-zinc-500'}`}>
          <Icon size={20} className={isFocused ? "animate-pulse" : ""} />
        </div>
        
        <div className="relative flex-1 h-full px-4">
          <motion.label
            htmlFor={id}
            initial={false}
            animate={{
              y: (isFocused || isFilled) ? -14 : 0,
              x: (isFocused || isFilled) ? -2 : 0,
              scale: (isFocused || isFilled) ? 0.75 : 1,
              color: isFocused ? "#a855f7" : (isFilled ? "#71717a" : "#52525b"),
            }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-5 left-4 pointer-events-none origin-left font-medium text-sm select-none"
          >
            {label}
          </motion.label>
          
          <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            required={required}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full h-full bg-transparent pt-4 pb-1 text-sm text-zinc-100 focus:outline-none placeholder:opacity-0 transition-all"
            autoComplete="off"
          />
        </div>

        {showPasswordToggle && (
          <button
            type="button"
            onClick={onPasswordToggle}
            className="pr-5 text-zinc-500 hover:text-zinc-200 transition-colors"
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isPasswordVisible ? "eye-off" : "eye"}
                initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
              </motion.div>
            </AnimatePresence>
          </button>
        )}
      </div>
      
      {/* Dynamic Border Trail */}
      {isFocused && (
        <motion.div 
          layoutId="border-trail"
          className="absolute bottom-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"
        />
      )}
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

  const colors = ["bg-zinc-800", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"];
  const glows = ["", "shadow-[0_0_10px_rgba(239,68,68,0.3)]", "shadow-[0_0_10px_rgba(249,115,22,0.3)]", "shadow-[0_0_10px_rgba(234,179,8,0.3)]", "shadow-[0_0_15px_rgba(16,185,129,0.4)]"];
  
  return (
    <div className="mt-[-8px] mb-6 px-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Fingerprint size={12} className={password ? "text-purple-400 animate-pulse" : "text-zinc-600"} />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Security Matrix</span>
        </div>
        <motion.span 
          key={strength}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-[10px] font-bold uppercase tracking-wider ${strength >= 3 ? 'text-emerald-400' : 'text-zinc-400'}`}
        >
          {["Scanning...", "Vulnerable", "Exposed", "Encrypted", "Impenetrable"][strength]}
        </motion.span>
      </div>
      <div className="flex gap-1.5 h-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 relative overflow-hidden rounded-full bg-zinc-800/50">
            <motion.div 
              initial={false}
              animate={{ 
                x: i <= strength ? "0%" : "-100%",
              }}
              className={`absolute inset-0 ${colors[strength]} ${glows[strength]}`}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
            {i <= strength && (
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Application ---

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { signIn, signUp, resetPassword, user, profile } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Mouse trail effect for card
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRotateX = useSpring(useTransform(mouseY, [-300, 300], [5, -5]), { damping: 20 });
  const cardRotateY = useSpring(useTransform(mouseX, [-300, 300], [-5, 5]), { damping: 20 });

  function handleMouseMove(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  useEffect(() => {
    if (user && !isSuccess) {
      router.push("/dashboard");
    }
  }, [user, router, isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsError(false);
    
    try {
      if (isRecovery) {
        const { error } = await resetPassword(formData.email);
        if (error) throw new Error(error);
        toast.success("Recovery instructions sent to your email.");
        setIsRecovery(false);
        setIsLogin(true);
      } else if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw new Error(error);
        
        // Send login notification (fire and forget)
        console.log("Sending login notification...");
        fetch("/api/auth/send-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            type: "login", 
            email: formData.email, 
            name: profile?.full_name || formData.email.split('@')[0]
          }),
        }).then(res => res.json())
          .then(data => {
            if (data.error) console.warn("Notification error:", data.error);
            else console.log("Login notification sent successfully");
          })
          .catch(err => console.error("Notification fetch failed:", err));

        setIsSuccess(true);
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.name);
        if (error) throw new Error(error);

        // Send welcome email (fire and forget)
        console.log("Sending welcome email...");
        fetch("/api/auth/send-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            type: "signup", 
            email: formData.email, 
            name: formData.name 
          }),
        }).then(res => res.json())
          .then(data => {
            if (data.error) console.warn("Welcome email error:", data.error);
            else console.log("Welcome email sent successfully");
          })
          .catch(err => console.error("Welcome email fetch failed:", err));

        toast.success("Account created! Please check your email for verification.");
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setIsLogin(true);
        }, 1500);
      }
    } catch (err: any) {
      setIsError(true);
      toast.error(err.message || "Access Denied: Connection Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setIsRecovery(false);
    setIsError(false);
  };

  const toggleRecovery = () => {
    setIsRecovery(!isRecovery);
    setIsLogin(false);
    setIsError(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-purple-500/50">
      <BackgroundGradient />
      <GlassShards />
      <CarAnimation />
      <SuccessOverlay visible={isSuccess} />
      
      {/* HUD Elements */}
      <div className="fixed inset-0 pointer-events-none z-[1] hidden lg:block">
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-10 left-10 text-[10px] font-mono text-purple-500/40 space-y-1"
        >
          <p>{">"} SHASHTI_KARZ_SYSTEM_BOOT: OK</p>
          <p>{">"} AUTH_MODULE_LOADED: 100%</p>
          <p>{">"} ENCRYPTION_LEVEL: AES-256</p>
        </motion.div>
        
        <div className="absolute bottom-10 right-10 flex gap-4">
          <div className="w-48 h-[1px] bg-gradient-to-r from-transparent to-zinc-800" />
          <div className="text-[10px] font-mono text-zinc-600">v4.2.0-PRODUCTION</div>
        </div>
      </div>

      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX: cardRotateX, rotateY: cardRotateY, perspective: 1000 }}
        className="relative z-10 w-full max-w-lg"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isRecovery ? "recovery" : (isLogin ? "login" : "signup")}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              x: isError ? [0, -10, 10, -10, 10, 0] : 0
            }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            transition={{ 
              duration: 0.6,
              type: "spring",
              stiffness: 200,
              damping: 25,
              x: isError ? { type: "keyframes", duration: 0.4 } : undefined
            }}
            className="w-full"
          >
            <div className="backdrop-blur-3xl bg-zinc-900/40 border border-white/10 rounded-[40px] p-8 md:p-14 shadow-[0_30px_100px_rgba(0,0,0,0.6)] relative overflow-hidden group">
              <motion.div 
                style={{ 
                  left: useTransform(mouseX, [-300, 300], ["0%", "100%"]),
                  top: useTransform(mouseY, [-300, 300], ["0%", "100%"]),
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" 
              />

              <div className="relative z-10">
                <div className="flex justify-between items-center mb-12">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30"
                    >
                      <Zap size={24} className="text-white fill-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Shashti Karz</h2>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Live System</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={toggleMode}
                    className="group flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md active:scale-95"
                  >
                    <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">
                      {isLogin || isRecovery ? "Join Us" : "Login"}
                    </span>
                    <ChevronRight size={14} className="text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>

                <div className="mb-10">
                  <motion.h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
                    {isRecovery ? "Recovery." : (isLogin ? "Sign In." : "Sign Up.")}
                  </motion.h1>
                  <motion.p className="text-zinc-400 text-base leading-relaxed max-w-[320px]">
                    {isRecovery 
                      ? "Enter your Nexus address to initiate the recovery protocol."
                      : isLogin 
                        ? "Welcome back. Access the world's most advanced car detailing suite." 
                        : "The next generation of Shashti Karz starts here."}
                  </motion.p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {!isLogin && !isRecovery && (
                      <motion.div
                        key="name"
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        className="overflow-hidden"
                      >
                        <FloatingInput
                          id="full-name"
                          label="Identity Name"
                          icon={User}
                          value={formData.name}
                          onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                          required={!isLogin && !isRecovery}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <FloatingInput
                    id="email-addr"
                    label="Nexus Address (Email)"
                    icon={Mail}
                    type="email"
                    value={formData.email}
                    onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                    required
                    error={isError}
                  />

                  {!isRecovery && (
                    <FloatingInput
                      id="pass-key"
                      label="Security Cipher (Password)"
                      icon={Lock}
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
                      required
                      showPasswordToggle
                      isPasswordVisible={showPassword}
                      onPasswordToggle={() => setShowPassword(!showPassword)}
                      error={isError}
                    />
                  )}

                  {!isLogin && !isRecovery && <PasswordScanner password={formData.password} />}

                  {isLogin && (
                    <div className="flex items-center justify-between px-2 pt-2 pb-6">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="checkbox" className="peer sr-only" />
                          <div className="w-5 h-5 rounded-lg bg-zinc-800/80 border border-zinc-700 peer-checked:bg-purple-600 peer-checked:border-purple-500 transition-all duration-300" />
                          <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">Keep Session Active</span>
                      </label>
                      <button 
                        type="button" 
                        onClick={toggleRecovery}
                        className="text-xs font-bold text-zinc-500 hover:text-purple-400 transition-colors"
                      >
                        Recovery Protocol
                      </button>
                    </div>
                  )}

                  {isRecovery && (
                    <div className="flex items-center justify-end px-2 pt-2 pb-6">
                      <button 
                        type="button" 
                        onClick={toggleMode}
                        className="text-xs font-bold text-zinc-500 hover:text-purple-400 transition-colors"
                      >
                        Return to Sign In
                      </button>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98, y: 0 }}
                    disabled={isLoading}
                    className="w-full relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-80 transition-opacity duration-500" />
                    <div className="relative flex items-center justify-center gap-3 bg-[#0a0a0a] border border-white/10 p-[2px] rounded-2xl overflow-hidden transition-all group-hover:border-purple-500/50">
                      <div className="w-full h-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500/90 to-blue-500/90 py-4.5 rounded-[14px] text-white font-black text-sm uppercase tracking-[0.15em]">
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2 size={22} />
                          </motion.div>
                        ) : (
                          <>
                            <span>
                              {isRecovery 
                                ? "Initiate Recovery" 
                                : isLogin ? "Authorize Access" : "Initialize Account"}
                            </span>
                            <motion.div
                              animate={{ x: [0, 5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <ArrowRight size={20} />
                            </motion.div>
                          </>
                        )}
                      </div>
                      
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
                        animate={{ x: ["100%", "-100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                      />
                    </div>
                  </motion.button>
                </form>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-6"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
            <ShieldCheck size={14} className="text-purple-400" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">End-to-End Encryption</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
            <Trophy size={14} className="text-blue-400" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Award Winning UX</span>
          </div>
        </motion.div>
      </motion.div>

      <div className="fixed top-8 right-8 z-50 flex items-center gap-3">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-xl"
        >
          <Globe size={18} className="text-zinc-400" />
        </motion.button>
        <div className="h-6 w-[1px] bg-white/10 mx-1" />
        <button className="text-xs font-bold text-zinc-500 hover:text-white transition-colors">HELP</button>
      </div>

      <div className="fixed bottom-8 left-8 z-50 flex items-center gap-4">
        <div className="flex -space-x-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center">
              <User size={12} className="text-zinc-500" />
            </div>
          ))}
        </div>
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">1.2k Active Now</span>
      </div>
    </main>
  );
}
