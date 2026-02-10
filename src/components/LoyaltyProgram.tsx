"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import {
  Trophy, Star, Gift, Users, Sparkles, Crown,
  ArrowRight, Copy, Check, Zap, TrendingUp, Calendar
} from "lucide-react";
import type { LoyaltyPoints, LoyaltyTransaction } from "@/lib/types";
import { AnimatedCounter } from "@/components/animations/AnimatedCounter";

const tiers = [
  { id: "bronze", name: "Bronze", minPoints: 0, color: "#CD7F32", benefits: ["5% discount on services", "Birthday bonus points"] },
  { id: "silver", name: "Silver", minPoints: 1000, color: "#C0C0C0", benefits: ["10% discount on services", "Priority booking", "Free car wash monthly"] },
  { id: "gold", name: "Gold", minPoints: 5000, color: "#FFD700", benefits: ["15% discount on services", "VIP lounge access", "Free detailing quarterly"] },
  { id: "platinum", name: "Platinum", minPoints: 15000, color: "#E5E4E2", benefits: ["20% discount on services", "Dedicated service manager", "Free ceramic coating annually"] },
];

interface LoyaltyProgramProps {
  userId?: string;
  showDemo?: boolean;
}

export function LoyaltyProgram({ userId, showDemo = false }: LoyaltyProgramProps) {
  const [loyalty, setLoyalty] = useState<LoyaltyPoints | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchLoyaltyData();
    } else if (showDemo) {
      setLoyalty({
        id: "demo",
        user_id: "demo",
        points: 3250,
        tier: "silver",
        total_spent: 45000,
        total_bookings: 12,
        referral_code: "SHASHTI-DEMO123",
        referred_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setTransactions([
        { id: "1", user_id: "demo", booking_id: "b1", points: 500, type: "earned", description: "Ceramic Coating Service", created_at: new Date().toISOString() },
        { id: "2", user_id: "demo", booking_id: null, points: 200, type: "referral", description: "Referred Priya Sharma", created_at: new Date().toISOString() },
        { id: "3", user_id: "demo", booking_id: "b2", points: -300, type: "redeemed", description: "Discount on Full Detailing", created_at: new Date().toISOString() },
      ]);
      setIsLoading(false);
    }
  }, [userId, showDemo]);

  const fetchLoyaltyData = async () => {
    if (!userId) return;

    try {
      const { data: loyaltyData } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (loyaltyData) {
        setLoyalty(loyaltyData);
      }

      const { data: transactionsData } = await supabase
        .from("loyalty_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      setTransactions(transactionsData || []);
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (loyalty?.referral_code) {
      navigator.clipboard.writeText(loyalty.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentTier = tiers.find(t => t.id === loyalty?.tier) || tiers[0];
  const nextTier = tiers[tiers.findIndex(t => t.id === loyalty?.tier) + 1];
  const pointsToNext = nextTier ? nextTier.minPoints - (loyalty?.points || 0) : 0;
  const progressPercent = nextTier
    ? Math.min(100, ((loyalty?.points || 0) - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints) * 100)
    : 100;

  if (isLoading && !showDemo) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <section className="py-12 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0d0a08] to-[#0a0a0a]" />
      <motion.div
        className="absolute top-1/4 right-1/4 w-72 h-72 lg:w-96 lg:h-96 rounded-full blur-[120px] lg:blur-[150px]"
        style={{ background: `radial-gradient(circle, ${currentTier.color}20, transparent)` }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-left lg:text-center mb-8 lg:mb-12"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-xs font-bold mb-3 uppercase tracking-wider">
            <Trophy size={14} />
            Exclusive Rewards
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold font-display mb-3">
            <span className="text-gradient-gold">Loyalty</span> Program
          </h2>
          <p className="text-[#888] text-sm lg:text-base max-w-2xl lg:mx-auto">
            Experience premium detailing and earn points worth real value.
          </p>
        </motion.div>

        {loyalty && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Main Stats and Card */}
            <div className="lg:col-span-8 space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-[2rem] p-6 lg:p-8 relative overflow-hidden border border-white/5"
              >
                <div
                  className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[80px] opacity-20 transition-all duration-1000"
                  style={{ background: currentTier.color }}
                />

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/10">
                      <Crown size={32} style={{ color: currentTier.color }} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold flex items-center gap-2" style={{ color: currentTier.color }}>
                        {currentTier.name}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 font-mono">#{loyalty.tier.toUpperCase()}</span>
                      </h3>
                      <p className="text-xs text-[#666] font-medium tracking-wide">MEMBER SINCE {new Date(loyalty.created_at).getFullYear()}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4 sm:min-w-[180px]">
                    <div className="w-10 h-10 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37]">
                      <Star size={20} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white leading-none">
                        <AnimatedCounter end={loyalty.points} duration={1500} />
                      </div>
                      <p className="text-[10px] text-[#888] font-bold uppercase tracking-widest mt-1">Total Points</p>
                    </div>
                  </div>
                </div>

                {nextTier && (
                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                      <span className="text-[#666]">Progress to {nextTier.name}</span>
                      <span className="text-[#d4af37]">{pointsToNext} points away</span>
                    </div>
                    <div className="relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                        style={{ background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Bookings", value: loyalty.total_bookings, icon: Calendar },
                    { label: "Invested", value: `₹${loyalty.total_spent}`, icon: Zap },
                    { label: "Benefits", value: currentTier.benefits.length, icon: Gift },
                    { label: "Discount", value: `${Math.round((loyalty.points / 100) * 10)}%`, icon: Star },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                      <stat.icon size={16} className="text-[#444] mb-2" />
                      <div className="text-lg font-bold text-white">{stat.value}</div>
                      <div className="text-[10px] text-[#666] font-bold uppercase tracking-tight">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Referral Card */}
                <div className="glass-card rounded-3xl p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2">
                      <Users size={18} className="text-[#ff1744]" />
                      Invite Friends
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-1 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20">
                      +200 PTS
                    </span>
                  </div>
                  <p className="text-xs text-[#888] mb-4 leading-relaxed">
                    Gift a friend a detailing experience and earn rewards when they book.
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 bg-white/5 rounded-xl font-mono text-sm border border-white/5 flex items-center">
                      {loyalty.referral_code}
                    </div>
                    <button
                      onClick={copyReferralCode}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all active:scale-95"
                    >
                      {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-[#888]" />}
                    </button>
                  </div>
                </div>

                {/* Quick Earnings */}
                <div className="glass-card rounded-3xl p-6 border border-white/5">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#d4af37]" />
                    Recent Activity
                  </h3>
                  <div className="space-y-4 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                    {transactions.length > 0 ? transactions.map((tx, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${tx.points > 0 ? "bg-green-500" : "bg-red-500"}`} />
                          <span className="text-[#888] truncate max-w-[120px]">{tx.description}</span>
                        </div>
                        <span className={`font-bold ${tx.points > 0 ? "text-green-500" : "text-red-500"}`}>
                          {tx.points > 0 ? "+" : ""}{tx.points}
                        </span>
                      </div>
                    )) : (
                      <p className="text-[#444] text-[10px] text-center mt-4 uppercase font-bold">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tiers Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-card rounded-[2rem] p-6 lg:p-8 border border-white/5">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Crown size={20} className="text-[#d4af37]" />
                  Membership Path
                </h3>

                <div className="space-y-3">
                  {tiers.map((tier, i) => (
                    <div
                      key={tier.id}
                      className={`p-4 rounded-2xl border transition-all duration-500 ${tier.id === loyalty.tier
                        ? "bg-white/[0.03] border-white/20 shadow-xl"
                        : "border-transparent opacity-40 grayscale"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Crown size={14} style={{ color: tier.color }} />
                          <span className="font-bold text-sm tracking-tight">{tier.name}</span>
                        </div>
                        {tier.id === loyalty.tier && (
                          <span className="px-2 py-0.5 bg-[#ff1744] rounded-full text-[9px] font-black uppercase shadow-[0_0_10px_rgba(255,23,68,0.5)]">Current</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-1">
                          {tier.benefits.slice(0, 3).map((_, idx) => (
                            <div key={idx} className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                              <Sparkles size={8} style={{ color: tier.color }} />
                            </div>
                          ))}
                        </div>
                        <span className="text-[10px] text-[#666] font-mono">{tier.minPoints.toLocaleString()} PTS+</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                  <h4 className="text-[10px] font-black uppercase text-[#444] tracking-widest mb-4">Earning Rules</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: "Book a service", pts: "1pt/₹10" },
                      { label: "Friend Referral", pts: "+200" },
                      { label: "Review Service", pts: "+50" },
                    ].map((rule, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-[#888]">{rule.label}</span>
                        <span className="text-[#d4af37]">{rule.pts}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loyalty && !showDemo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="glass-card rounded-[3rem] p-12 max-w-lg mx-auto border border-white/5">
              <div className="w-20 h-20 bg-gradient-to-br from-[#d4af37]/20 to-transparent rounded-full flex items-center justify-center mx-auto mb-6 border border-[#d4af37]/20">
                <Trophy size={40} className="text-[#d4af37]" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Join Our Loyalty Program</h3>
              <p className="text-[#888] mb-8 leading-relaxed">Sign up today to start earning points and unlock exclusive Detailing Benefits.</p>
              <a href="/login" className="btn-premium px-10 py-4 rounded-2xl inline-flex items-center gap-2 font-bold transition-transform active:scale-95">
                Join Now <ArrowRight size={18} />
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export function LoyaltyProgramDemo() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
      setIsLoading(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <section className="py-24 relative overflow-hidden">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  return <LoyaltyProgram userId={userId || undefined} showDemo={!userId} />;
}
