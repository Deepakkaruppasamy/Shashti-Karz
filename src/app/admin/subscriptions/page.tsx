"use client";

import { useState, useEffect } from "react";
import {
    Crown,
    RotateCcw,
    Users,
    DollarSign,
    BarChart,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Search,
    Filter,
    ChevronRight,
    Receipt
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { BrandedLoader } from "@/components/animations/BrandedLoader";

export default function SubscriptionsAdminPage() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "plans" | "subscribers">("overview");
    const [stats, setStats] = useState({
        active: 0,
        mrr: 0,
        churn_rate: 1.2, // Mocked for now
        total_revenue: 0
    });
    const [plans, setPlans] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch Plans
            const { data: plansData } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('price', { ascending: true });
            setPlans(plansData || []);

            // Fetch Subscriptions
            const { data: subsData } = await supabase
                .from('user_subscriptions')
                .select('*, profile:user_id(full_name, email), plan:plan_id(name, price)')
                .order('created_at', { ascending: false });

            setSubscriptions(subsData || []);

            // Calculate Stats
            const activeSubs = subsData?.filter(s => s.status === 'active') || [];
            const mrr = activeSubs.reduce((acc, sub) => acc + (sub.plan?.price || 0), 0);

            setStats({
                active: activeSubs.length,
                mrr: mrr,
                churn_rate: 1.2,
                total_revenue: mrr * 12 // Estimate
            });

        } catch (error) {
            console.error('Error loading subscription data:', error);
            toast.error('Failed to load subscription data');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePlan = async (id: string, active: boolean) => {
        try {
            await supabase.from('subscription_plans').update({ active }).eq('id', id);
            toast.success(`Plan ${active ? 'activated' : 'deactivated'}`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update plan');
        }
    };

    const activeSubscriptions = subscriptions.filter(s =>
        s.status === 'active' &&
        (s.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) return <BrandedLoader fullPage />;

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-4 lg:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white mb-2 flex items-center gap-3">
                        <Crown className="text-[#d4af37]" /> Subscription Command
                    </h1>
                    <p className="text-[#888]">Manage recurring revenue and member tiers</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl w-fit">
                    {(['overview', 'subscribers', 'plans'] as const).map((tab) => (
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

            {activeTab === "overview" && (
                <div className="space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="glass-card p-6 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500"><Users size={20} /></div>
                                <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">+5.2%</span>
                            </div>
                            <h3 className="text-2xl font-black text-white">{stats.active}</h3>
                            <p className="text-xs text-[#888] uppercase tracking-wider font-bold">Active Members</p>
                        </div>

                        <div className="glass-card p-6 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-500/10 rounded-xl text-green-500"><DollarSign size={20} /></div>
                                <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">+12%</span>
                            </div>
                            <h3 className="text-2xl font-black text-white">₹{stats.mrr.toLocaleString()}</h3>
                            <p className="text-xs text-[#888] uppercase tracking-wider font-bold">Monthly Recurring Revenue</p>
                        </div>

                        <div className="glass-card p-6 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-red-500/10 rounded-xl text-red-500"><AlertTriangle size={20} /></div>
                                <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">-0.5%</span>
                            </div>
                            <h3 className="text-2xl font-black text-white">{stats.churn_rate}%</h3>
                            <p className="text-xs text-[#888] uppercase tracking-wider font-bold">Monthly Churn</p>
                        </div>
                    </div>

                    <div className="glass-card rounded-2xl border border-white/5 p-6 md:p-8 flex items-center justify-center min-h-[300px]">
                        <div className="text-center">
                            <BarChart className="mx-auto mb-4 text-[#444]" size={48} />
                            <p className="text-[#888]">Revenue analytics visualization would go here</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "subscribers" && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" size={16} />
                            <input
                                type="text"
                                placeholder="Search members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 rounded-xl bg-black/20 border border-white/10 text-sm focus:border-[#d4af37] outline-none w-64"
                            />
                        </div>
                        <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#888] hover:text-white">
                            <Filter size={14} /> Filter
                        </button>
                    </div>

                    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Member</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Current Plan</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Started</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Next Billing</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {activeSubscriptions.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b] flex items-center justify-center text-xs font-bold text-black">
                                                    {sub.profile?.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{sub.profile?.full_name}</p>
                                                    <p className="text-[10px] text-[#666]">{sub.profile?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-white">{sub.plan?.name}</span>
                                            <p className="text-[10px] text-[#d4af37]">₹{sub.plan?.price}/mo</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sub.status === 'active' ? 'bg-green-500/10 text-green-500' :
                                                    sub.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                                                        'bg-yellow-500/10 text-yellow-500'
                                                }`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-[#888]">
                                            {new Date(sub.started_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-[#888]">
                                            {sub.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-[#888] hover:text-white"><ChevronRight size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "plans" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className={`glass-card p-6 rounded-2xl border ${plan.active ? 'border-[#d4af37]/30' : 'border-white/5 opacity-60'} relative group`}>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-black text-white">{plan.name}</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleTogglePlan(plan.id, !plan.active)}
                                        className={`p-2 rounded-lg transition-colors ${plan.active ? 'text-green-500 bg-green-500/10' : 'text-[#666] bg-white/5'}`}
                                    >
                                        {plan.active ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="mb-6">
                                <span className="text-3xl font-black text-[#d4af37]">₹{plan.price}</span>
                                <span className="text-sm text-[#888]"> / {plan.billing_cycle}</span>
                            </div>

                            <div className="space-y-3 mb-6">
                                {plan.features?.map((feature: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-[#ccc]">
                                        <CheckCircle size={14} className="text-[#d4af37]" />
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider border-t border-white/5 pt-4">
                                <span className="text-[#666]">{plan.subscribers_count || 0} active members</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
