"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Gift, Copy, Share2, Star, TrendingUp, CheckCircle2, Clock, Award } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import toast from "react-hot-toast";
import type { Referral } from "@/lib/types";

export default function ReferralsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myCode, setMyCode] = useState<string | null>(null);
  const [applyCode, setApplyCode] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadReferrals();
    }
  }, [user]);

  const loadReferrals = async () => {
    try {
      const response = await fetch(`/api/referrals?referrer_id=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setReferrals(data);
        const activeCode = data.find((r: Referral) => r.status === "pending" && !r.referred_id);
        if (activeCode) {
          setMyCode(activeCode.code);
        }
      }
    } catch (error) {
      console.error("Error loading referrals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = async () => {
    try {
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", user_id: user?.id }),
      });
      if (response.ok) {
        const data = await response.json();
        setMyCode(data.code);
        toast.success("Referral code generated!");
        loadReferrals();
      }
    } catch (error) {
      toast.error("Error generating code");
    }
  };

  const copyCode = () => {
    if (myCode) {
      navigator.clipboard.writeText(myCode);
      toast.success("Code copied!");
    }
  };

  const shareCode = () => {
    if (myCode) {
      const message = `Get amazing car detailing at Shashti Karz! Use my referral code ${myCode} and we both earn rewards. Book now!`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    }
  };

  const handleApplyCode = async () => {
    if (!applyCode.trim()) return;

    try {
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply", code: applyCode, referred_id: user?.id }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Referral applied! You earned bonus rewards!");
        setApplyCode("");
      } else {
        toast.error(data.error || "Invalid code");
      }
    } catch (error) {
      toast.error("Error applying code");
    }
  };

  const completedReferrals = referrals.filter((r) => r.status === "completed" || r.status === "rewarded");
  const totalEarned = completedReferrals.reduce((sum, r) => sum + r.reward_amount, 0);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ff1744] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-display">Refer & Earn</h1>
            <p className="text-[#888] mt-2">Share with friends and earn rewards together</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Users, label: "Total Referrals", value: completedReferrals.length, color: "from-blue-500 to-cyan-500" },
              { icon: Star, label: "Total Earned", value: `₹${totalEarned}`, color: "from-[#d4af37] to-[#ffd700]" },
              { icon: Gift, label: "Per Referral", value: "₹500", color: "from-[#ff1744] to-[#ff4569]" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-6 text-center"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-3`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-[#888]">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="glass-card rounded-2xl p-6 mb-8">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Gift size={20} className="text-[#ff1744]" />
              Your Referral Code
            </h2>

            {myCode ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 p-4 rounded-xl bg-gradient-to-r from-[#ff1744]/10 to-[#d4af37]/10 border border-white/10 text-center">
                  <span className="text-3xl font-bold font-mono tracking-widest">{myCode}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyCode}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium flex items-center justify-center gap-2"
                  >
                    <Copy size={18} />
                    Copy
                  </button>
                  <button
                    onClick={shareCode}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-[#25D366] text-white font-medium flex items-center justify-center gap-2"
                  >
                    <Share2 size={18} />
                    Share
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={generateCode}
                className="w-full btn-premium px-6 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
              >
                <Gift size={20} />
                Generate My Code
              </button>
            )}
          </div>

          <div className="glass-card rounded-2xl p-6 mb-8">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Award size={20} className="text-[#d4af37]" />
              Have a Code?
            </h2>
            <p className="text-[#888] text-sm mb-4">Enter a friend&apos;s referral code to get bonus rewards on your first booking!</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={applyCode}
                onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none font-mono"
              />
              <button
                onClick={handleApplyCode}
                disabled={!applyCode.trim()}
                className="px-6 py-3 rounded-xl bg-[#ff1744] text-white font-medium disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 mb-8">
            <h2 className="font-semibold mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-500" />
              How It Works
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { step: 1, title: "Share Your Code", desc: "Send your unique code to friends & family" },
                { step: 2, title: "Friend Books", desc: "They book a service using your code" },
                { step: 3, title: "Both Earn", desc: "You get ₹500, they get 10% off!" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="font-medium mb-1">{item.title}</h3>
                  <p className="text-sm text-[#888]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {referrals.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Users size={20} className="text-blue-500" />
                Referral History
              </h2>
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        referral.status === "rewarded" ? "bg-green-500/20" :
                        referral.status === "completed" ? "bg-blue-500/20" :
                        "bg-yellow-500/20"
                      }`}>
                        {referral.status === "rewarded" ? <CheckCircle2 size={20} className="text-green-500" /> :
                         referral.status === "completed" ? <Star size={20} className="text-blue-500" /> :
                         <Clock size={20} className="text-yellow-500" />}
                      </div>
                      <div>
                        <p className="font-medium">{referral.code}</p>
                        <p className="text-xs text-[#888]">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium capitalize ${
                        referral.status === "rewarded" ? "text-green-500" :
                        referral.status === "completed" ? "text-blue-500" :
                        "text-yellow-500"
                      }`}>
                        {referral.status}
                      </span>
                      {referral.reward_amount > 0 && (
                        <p className="text-xs text-[#d4af37]">₹{referral.reward_amount}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
