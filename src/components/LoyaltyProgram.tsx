"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { 
  Trophy, Star, Gift, Users, Sparkles, Crown, 
  ArrowRight, Copy, Check, Zap, TrendingUp
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
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0d0a08] to-[#0a0a0a]" />
      <motion.div
        className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-[150px]"
        style={{ background: `radial-gradient(circle, ${currentTier.color}20, transparent)` }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-sm mb-4">
            <Trophy size={16} />
            Rewards Program
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            <span className="text-gradient-gold">Loyalty</span> Rewards
          </h2>
          <p className="text-[#888] max-w-2xl mx-auto">
            Earn points with every service and unlock exclusive benefits
          </p>
        </motion.div>

        {loyalty && (
          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                <div 
                  className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-30"
                  style={{ background: currentTier.color }}
                />
                
                <div className="relative flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Crown size={24} style={{ color: currentTier.color }} />
                      <span className="text-2xl font-bold" style={{ color: currentTier.color }}>
                        {currentTier.name} Member
                      </span>
                    </div>
                    <p className="text-[#888]">Member since {new Date(loyalty.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-4xl font-bold text-gradient">
                      <AnimatedCounter end={loyalty.points} duration={1500} />
                    </div>
                    <p className="text-sm text-[#888]">Total Points</p>
                  </div>
                </div>

                {nextTier && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#888]">Progress to {nextTier.name}</span>
                      <span className="text-[#d4af37]">{pointsToNext} points to go</span>
                    </div>
                    <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      <AnimatedCounter end={loyalty.total_bookings} />
                    </div>
                    <p className="text-xs text-[#888]">Total Bookings</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      ₹<AnimatedCounter end={loyalty.total_spent} />
                    </div>
                    <p className="text-xs text-[#888]">Total Spent</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#d4af37]">
                      {Math.round((loyalty.points / 100) * 10)}%
                    </div>
                    <p className="text-xs text-[#888]">Current Discount</p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Gift size={20} className="text-[#ff1744]" />
                    Referral Program
                  </h3>
                  <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm">
                    +200 pts per referral
                  </span>
                </div>
                
                <p className="text-[#888] mb-4">
                  Share your code with friends and earn 200 points when they complete their first service!
                </p>
                
                <div className="flex gap-3">
                  <div className="flex-1 px-4 py-3 bg-white/5 rounded-xl font-mono text-lg">
                    {loyalty.referral_code}
                  </div>
                  <motion.button
                    onClick={copyReferralCode}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-3 bg-[#ff1744] rounded-xl flex items-center gap-2"
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                    {copied ? "Copied!" : "Copy"}
                  </motion.button>
                </div>

                <div className="flex gap-3 mt-4">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Get amazing car detailing at Shashti Karz! Use my referral code ${loyalty.referral_code} for a special discount.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 bg-[#25D366]/20 text-[#25D366] rounded-xl text-center hover:bg-[#25D366]/30 transition-colors"
                  >
                    Share on WhatsApp
                  </a>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-[#d4af37]" />
                  Recent Activity
                </h3>
                
                <div className="space-y-3">
                  {transactions.map((tx, i) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          tx.type === "earned" ? "bg-green-500/20" :
                          tx.type === "referral" ? "bg-blue-500/20" :
                          tx.type === "redeemed" ? "bg-orange-500/20" : "bg-white/10"
                        }`}>
                          {tx.type === "earned" && <Star size={18} className="text-green-500" />}
                          {tx.type === "referral" && <Users size={18} className="text-blue-500" />}
                          {tx.type === "redeemed" && <Gift size={18} className="text-orange-500" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{tx.description}</p>
                          <p className="text-xs text-[#888]">{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`font-semibold ${tx.points > 0 ? "text-green-500" : "text-orange-500"}`}>
                        {tx.points > 0 ? "+" : ""}{tx.points}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Membership Tiers</h3>
                
                <div className="space-y-4">
                  {tiers.map((tier, i) => (
                    <motion.div
                      key={tier.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-4 rounded-xl border transition-all ${
                        tier.id === loyalty.tier
                          ? "border-2 bg-white/5"
                          : "border-white/10 opacity-60"
                      }`}
                      style={{ borderColor: tier.id === loyalty.tier ? tier.color : undefined }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Crown size={20} style={{ color: tier.color }} />
                        <span className="font-semibold">{tier.name}</span>
                        {tier.id === loyalty.tier && (
                          <span className="px-2 py-0.5 bg-[#ff1744] rounded-full text-xs">Current</span>
                        )}
                      </div>
                      <p className="text-xs text-[#888] mb-2">{tier.minPoints.toLocaleString()}+ points</p>
                      <ul className="space-y-1">
                        {tier.benefits.map((benefit, j) => (
                          <li key={j} className="text-xs text-[#aaa] flex items-center gap-2">
                            <Sparkles size={10} style={{ color: tier.color }} />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-[#ff1744]" />
                  Ways to Earn
                </h3>
                
                <div className="space-y-3">
                  {[
                    { action: "Book a service", points: "1 pt per ₹10" },
                    { action: "Refer a friend", points: "+200 pts" },
                    { action: "Write a review", points: "+50 pts" },
                    { action: "Birthday bonus", points: "+100 pts" },
                    { action: "First booking", points: "+200 pts" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-sm text-[#aaa]">{item.action}</span>
                      <span className="text-sm font-medium text-[#d4af37]">{item.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {!loyalty && !showDemo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="glass-card rounded-2xl p-8 max-w-md mx-auto">
              <Trophy size={48} className="text-[#d4af37] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Join Our Rewards Program</h3>
              <p className="text-[#888] mb-6">Sign up to start earning points and unlock exclusive benefits</p>
              <a href="/login" className="btn-premium px-8 py-3 rounded-xl inline-flex items-center gap-2">
                Get Started <ArrowRight size={18} />
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
