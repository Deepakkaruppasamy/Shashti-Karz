"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Trophy,
    Gift,
    Briefcase,
    CheckCircle,
    XCircle,
    Search,
    TrendingUp,
    Share2,
    Building2,
    Medal,
    ChevronRight,
    Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { BrandedLoader } from "@/components/animations/BrandedLoader";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export default function ReferralsAdminPage() {
    const [loading, setLoading] = useState(true);
    const [tiers, setTiers] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [corporateRequests, setCorporateRequests] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"overview" | "corporate">("overview");

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch Tiers
            const { data: tiersData } = await supabase
                .from('referral_tiers')
                .select('*')
                .order('tier_level', { ascending: true });
            setTiers(tiersData || []);

            // Fetch Leaderboard (Top 10)
            const { data: lbData } = await supabase
                .from('referral_leaderboard')
                .select('*, profile:user_id(full_name, email)')
                .order('rank', { ascending: true })
                .limit(10);
            setLeaderboard(lbData || []);

            // Fetch Corporate Referrals
            const { data: corpData } = await supabase
                .from('corporate_referrals')
                .select('*')
                .order('created_at', { ascending: false });
            setCorporateRequests(corpData || []);

        } catch (error) {
            console.error('Error loading referral data:', error);
            toast.error('Failed to load referral data');
        } finally {
            setLoading(false);
        }
    };

    // Real-time Leaderboard Updates
    useRealtimeSubscription({
        table: 'referral_leaderboard',
        onUpdate: (updatedUser) => {
            // In a perfect world we would sort again, but updating the specific user record is a good start
            // Or we just re-fetch the leaderboard to keep ranking correct
            fetchData();
        },
        onInsert: () => fetchData() // New user joined leaderboard
    });

    // Real-time Corporate Requests
    useRealtimeSubscription({
        table: 'corporate_referrals',
        onInsert: (newReq) => {
            setCorporateRequests(prev => [newReq, ...prev]);
            toast.info(`New Corporate Partnership Request: ${newReq.company_name}`);
        },
        onUpdate: (updatedReq) => {
            setCorporateRequests(prev => prev.map(c => c.id === updatedReq.id ? updatedReq : c));
        }
    });

    const handleCorporateAction = async (id: string, status: 'active' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('corporate_referrals')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            toast.success(`Corporate request ${status}`);
            // Optimistic update handled by realtime subscription usually, but good to have fallback
            // fetchData(); 
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (loading) return <BrandedLoader fullPage />;

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-4 lg:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white mb-2 flex items-center gap-3">
                        <Share2 className="text-[#d4af37]" /> Referral Program
                    </h1>
                    <p className="text-[#888]">Manage rewards, tiers, and corporate partners</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "overview"
                            ? 'bg-[#d4af37] text-black font-bold shadow-lg shadow-[#d4af37]/25'
                            : 'text-[#888] hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Program Overview
                    </button>
                    <button
                        onClick={() => setActiveTab("corporate")}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "corporate"
                            ? 'bg-[#d4af37] text-black font-bold shadow-lg shadow-[#d4af37]/25'
                            : 'text-[#888] hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Corporate Partners
                    </button>
                </div>
            </div>

            {activeTab === "overview" && (
                <div className="space-y-8">
                    {/* Tiers Grid */}
                    <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Medal className="text-[#d4af37]" /> Reward Tiers
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {tiers.map((tier) => (
                                <div key={tier.id} className="glass-card p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-[#d4af37]/30 transition-all">
                                    <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-${tier.tier_name === 'Diamond' ? 'blue' : tier.tier_name === 'Gold' ? 'yellow' : 'gray'}-500/10 rounded-full blur-2xl -mr-10 -mt-10`} />
                                    <div className="relative z-10">
                                        <h3 className="text-lg font-black uppercase text-[#d4af37]">{tier.tier_name}</h3>
                                        <p className="text-xs text-[#888] font-bold tracking-wider mb-4">LEVEL {tier.tier_level}</p>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[#666]">Min Referrals</span>
                                                <span className="font-bold text-white">{tier.min_referrals}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[#666]">Reward</span>
                                                <span className="font-bold text-green-400">₹{tier.reward_amount}</span>
                                            </div>
                                        </div>

                                        <div className="bg-white/5 rounded-lg p-2">
                                            <p className="text-[10px] text-[#888] uppercase font-bold mb-1">Perks</p>
                                            <ul className="text-xs text-white/80 space-y-1">
                                                {tier.perks?.map((perk: string, i: number) => (
                                                    <li key={i} className="flex items-center gap-1.5">
                                                        <Gift size={10} className="text-[#d4af37]" /> {perk}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Trophy className="text-[#ff1744]" /> Top Referrers
                            </h2>
                        </div>
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Rank</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Total Referrals</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Successful</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Rewards Earned</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Current Tier</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {leaderboard.map((user) => (
                                    <tr key={user.user_id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${user.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                                                user.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                                                    user.rank === 3 ? 'bg-orange-700/20 text-orange-700' :
                                                        'bg-white/5 text-[#888]'
                                                }`}>
                                                {user.rank}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-white">{user.profile?.full_name || 'Anonymous'}</p>
                                            <p className="text-xs text-[#666]">{user.profile?.email}</p>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-white">{user.total_referrals}</td>
                                        <td className="px-6 py-4 font-mono text-green-400">{user.successful_referrals}</td>
                                        <td className="px-6 py-4 font-mono text-[#d4af37]">₹{user.total_rewards}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-full bg-white/10 text-xs font-bold uppercase">
                                                Tier {user.current_tier}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "corporate" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 glass-card rounded-2xl border border-white/5 overflow-hidden">
                            <div className="p-6 border-b border-white/5">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Building2 className="text-blue-500" /> Corporate Partnerships
                                </h2>
                            </div>
                            <div className="divide-y divide-white/5">
                                {corporateRequests.map((corp) => (
                                    <div key={corp.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-lg">{corp.company_name}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${corp.status === 'active' ? 'bg-green-500/10 text-green-500' :
                                                    corp.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                                        'bg-red-500/10 text-red-500'
                                                    }`}>{corp.status}</span>
                                            </div>
                                            <div className="text-sm text-[#888] space-y-1">
                                                <p>Contact: {corp.contact_person} ({corp.contact_email})</p>
                                                <p>Employees: {corp.total_employees} • Signed Up: {corp.employees_signed_up}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            {corp.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleCorporateAction(corp.id, 'active')}
                                                        className="px-3 py-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 text-xs font-bold uppercase flex items-center gap-2"
                                                    >
                                                        <CheckCircle size={14} /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleCorporateAction(corp.id, 'rejected')}
                                                        className="px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold uppercase flex items-center gap-2"
                                                    >
                                                        <XCircle size={14} /> Reject
                                                    </button>
                                                </>
                                            )}
                                            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#888]">
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {corporateRequests.length === 0 && (
                                    <div className="p-12 text-center text-[#666]">
                                        <Briefcase size={40} className="mx-auto mb-4 opacity-50" />
                                        <p>No corporate partnership requests found.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="glass-card p-6 rounded-2xl border border-white/5">
                            <h3 className="font-bold text-lg mb-4">Add Partner</h3>
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#888] uppercase mb-1">Company Name</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#d4af37]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#888] uppercase mb-1">Contact Person</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#d4af37]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#888] uppercase mb-1">Email</label>
                                    <input type="email" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#d4af37]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#888] uppercase mb-1">Employee Count</label>
                                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#d4af37]" />
                                </div>
                                <button className="w-full py-3 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold uppercase tracking-wide mt-2">
                                    Create Partnership
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
