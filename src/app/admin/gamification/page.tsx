"use client";

import { useState, useEffect } from "react";
import {
    Trophy,
    Medal,
    Star,
    TrendingUp,
    Users,
    Activity,
    Plus,
    Edit3,
    Trash2,
    CheckCircle,
    X,
    Search,
    Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { BrandedLoader } from "@/components/animations/BrandedLoader";

export default function GamificationAdminPage() {
    const [loading, setLoading] = useState(true);
    const [achievements, setAchievements] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"achievements" | "leaderboard" | "transactions">("achievements");
    const [showModal, setShowModal] = useState(false);
    const [editingAchievement, setEditingAchievement] = useState<any | null>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [achRes, lbRes, txRes] = await Promise.all([
                supabase.from('achievements').select('*').order('created_at', { ascending: false }),
                supabase.from('customer_leaderboard').select('*, profile:user_id(full_name, email)').order('rank', { ascending: true }).limit(20),
                supabase.from('points_transactions').select('*, profile:user_id(full_name)').order('created_at', { ascending: false }).limit(50)
            ]);

            if (achRes.error) throw achRes.error;
            setAchievements(achRes.data || []);
            setLeaderboard(lbRes.data || []);
            setTransactions(txRes.data || []);

        } catch (error) {
            console.error('Error loading gamification data:', error);
            toast.error('Failed to load gamification data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAchievement = async (id: string) => {
        if (!confirm("Are you sure? This will hide the achievement.")) return;
        const { error } = await supabase.from('achievements').update({ active: false }).eq('id', id);
        if (error) toast.error("Failed to delete");
        else {
            toast.success("Achievement deactivated");
            fetchData();
        }
    };

    const handleSaveAchievement = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
            name: formData.get('name'),
            description: formData.get('description'),
            points: parseInt(formData.get('points') as string),
            badge_icon: formData.get('badge_icon'),
            tier: formData.get('tier'),
            category: formData.get('category'),
            active: true,
            // Simple default criteria since JSON editing is complex
            unlock_criteria: editingAchievement?.unlock_criteria || { manual: true }
        };

        try {
            if (editingAchievement) {
                await supabase.from('achievements').update(data).eq('id', editingAchievement.id);
                toast.success("Achievement updated");
            } else {
                await supabase.from('achievements').insert([{ ...data, code: data.name?.toString().toLowerCase().replace(/\s+/g, '_') }]);
                toast.success("Achievement created");
            }
            setShowModal(false);
            setEditingAchievement(null);
            fetchData();
        } catch (error) {
            toast.error("Failed to save achievement");
        }
    };

    if (loading) return <BrandedLoader fullPage />;

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-4 lg:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white mb-2 flex items-center gap-3">
                        <Trophy className="text-[#d4af37]" /> Gamification
                    </h1>
                    <p className="text-[#888]">Manage achievements, points, and leaderboards</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl">
                    {(['achievements', 'leaderboard', 'transactions'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab
                                    ? 'bg-[#d4af37] text-black font-bold shadow-lg shadow-[#d4af37]/25'
                                    : 'text-[#888] hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === "achievements" && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button
                            onClick={() => { setEditingAchievement(null); setShowModal(true); }}
                            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold uppercase text-xs tracking-wider flex items-center gap-2"
                        >
                            <Plus size={16} /> New Achievement
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {achievements.map((ach) => (
                            <div key={ach.id} className={`glass-card p-6 rounded-2xl border ${ach.active ? 'border-white/5' : 'border-red-500/20 opacity-50'} relative group`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl">
                                        {ach.badge_icon || '🏆'}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingAchievement(ach); setShowModal(true); }} className="p-2 hover:bg-white/10 rounded-lg"><Edit3 size={16} /></button>
                                        <button onClick={() => handleDeleteAchievement(ach.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-1">{ach.name}</h3>
                                <p className="text-sm text-[#888] mb-4 h-10 line-clamp-2">{ach.description}</p>

                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                                    <span className={`px-2 py-1 rounded bg-${ach.tier === 'gold' ? 'yellow' : ach.tier === 'platinum' ? 'blue' : 'gray'}-500/10 text-${ach.tier === 'gold' ? 'yellow' : ach.tier === 'platinum' ? 'blue' : 'gray'}-500`}>
                                        {ach.tier}
                                    </span>
                                    <span className="text-[#d4af37] flex items-center gap-1">
                                        <Star size={12} fill="currentColor" /> {ach.points} Pts
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "leaderboard" && (
                <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Rank</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Total Points</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Bookings</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Money Spent</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Badges</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {leaderboard.map((user) => (
                                <tr key={user.user_id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${user.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                                                user.rank <= 3 ? 'bg-white/10 text-white' :
                                                    'text-[#666]'
                                            }`}>
                                            {user.rank}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                                                {user.profile?.full_name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{user.profile?.full_name || 'Anonymous'}</p>
                                                <p className="text-[10px] text-[#666] uppercase tracking-wider">{user.tier}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-[#d4af37] font-bold">{user.total_points}</td>
                                    <td className="px-6 py-4 text-[#888]">{user.total_bookings}</td>
                                    <td className="px-6 py-4 text-[#888]">₹{user.total_spent}</td>
                                    <td className="px-6 py-4 text-[#888]">{user.achievement_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === "transactions" && (
                <div className="space-y-4">
                    {transactions.map((tx) => (
                        <div key={tx.id} className="glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${tx.transaction_type === 'earned' ? 'bg-green-500/10 text-green-500' :
                                        tx.transaction_type === 'redeemed' ? 'bg-red-500/10 text-red-500' :
                                            'bg-blue-500/10 text-blue-500'
                                    }`}>
                                    {tx.transaction_type === 'earned' ? <Plus size={18} /> :
                                        tx.transaction_type === 'redeemed' ? <TrendingUp size={18} className="rotate-180" /> :
                                            <Activity size={18} />}
                                </div>
                                <div>
                                    <p className="font-bold text-white">{tx.description}</p>
                                    <p className="text-xs text-[#888]">{tx.profile?.full_name} • {new Date(tx.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className={`text-lg font-bold ${tx.transaction_type === 'earned' ? 'text-green-500' : 'text-red-500'
                                }`}>
                                {tx.transaction_type === 'earned' ? '+' : '-'}{tx.points}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-md w-full">
                            <h2 className="text-xl font-bold mb-6">{editingAchievement ? 'Edit Achievement' : 'New Achievement'}</h2>
                            <form onSubmit={handleSaveAchievement} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#888] uppercase mb-1">Name</label>
                                    <input name="name" defaultValue={editingAchievement?.name} required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#d4af37] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#888] uppercase mb-1">Description</label>
                                    <input name="description" defaultValue={editingAchievement?.description} required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#d4af37] outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#888] uppercase mb-1">Points</label>
                                        <input name="points" type="number" defaultValue={editingAchievement?.points || 100} required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#d4af37] outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#888] uppercase mb-1">Icon (Emoji)</label>
                                        <input name="badge_icon" defaultValue={editingAchievement?.badge_icon || '🏆'} required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#d4af37] outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#888] uppercase mb-1">Tier</label>
                                        <select name="tier" defaultValue={editingAchievement?.tier || 'bronze'} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#d4af37] outline-none">
                                            <option value="bronze">Bronze</option>
                                            <option value="silver">Silver</option>
                                            <option value="gold">Gold</option>
                                            <option value="platinum">Platinum</option>
                                            <option value="diamond">Diamond</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#888] uppercase mb-1">Category</label>
                                        <select name="category" defaultValue={editingAchievement?.category || 'bookings'} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#d4af37] outline-none">
                                            <option value="bookings">Bookings</option>
                                            <option value="loyalty">Loyalty</option>
                                            <option value="social">Social</option>
                                            <option value="eco">Eco</option>
                                            <option value="special">Special</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 rounded-lg bg-white/5 font-medium hover:bg-white/10">Cancel</button>
                                    <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold">Save</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
