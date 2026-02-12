"use client";

import { useState, useEffect } from "react";
import {
    Users,
    MapPin,
    Star,
    TrendingUp,
    Award,
    Calendar,
    Clock,
    CheckCircle,
    AlertTriangle,
    MoreVertical,
    Search,
    Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { BrandedLoader } from "@/components/animations/BrandedLoader";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface WorkerProfile {
    id: string;
    name: string;
    role: string;
    status: string;
    avatar_url?: string;
    performance?: WorkerPerformance[];
}

interface WorkerPerformance {
    worker_id: string;
    total_services: number;
    completed_services: number;
    average_rating: number;
    on_time_percentage: number;
    quality_score: number;
    efficiency_score: number;
    customer_satisfaction_score: number;
    total_revenue: number;
    total_reviews?: number;
}

interface TrainingNeed {
    id: string;
    worker_id: string;
    training_area: string;
    priority: string;
    status: string;
    identified_reason: string;
    worker?: { name: string };
}

export default function WorkersPage() {
    const [loading, setLoading] = useState(true);
    const [workers, setWorkers] = useState<WorkerProfile[]>([]);
    const [trainingNeeds, setTrainingNeeds] = useState<TrainingNeed[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"overview" | "training" | "bonuses">("overview");

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch Workers with Performance
            const { data: workersData, error } = await supabase
                .from('workers')
                .select(`
          *,
          performance:worker_performance(*)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch Training Needs
            const { data: trainingData } = await supabase
                .from('worker_training_needs')
                .select('*, worker:worker_id(name)')
                .order('created_at', { ascending: false });

            setWorkers(workersData || []);
            setTrainingNeeds(trainingData || []);

        } catch (error) {
            console.error('Error loading worker data:', error);
            toast.error('Failed to load worker data');
        } finally {
            setLoading(false);
        }
    };

    // Real-time Performance Updates
    useRealtimeSubscription({
        table: 'worker_performance',
        onUpdate: (updatedPerf) => {
            setWorkers(prev => prev.map(w =>
                w.id === updatedPerf.worker_id
                    ? { ...w, performance: [updatedPerf] }
                    : w
            ));
        }
    });

    // Real-time Worker Status Updates
    useRealtimeSubscription({
        table: 'workers',
        onInsert: (newWorker) => {
            setWorkers(prev => [newWorker, ...prev]);
            toast.success(`New worker added: ${newWorker.name}`);
        },
        onUpdate: (updatedWorker) => {
            setWorkers(prev => prev.map(w => w.id === updatedWorker.id ? { ...w, ...updatedWorker } : w));
        }
    });

    // Real-time Training Needs
    useRealtimeSubscription({
        table: 'worker_training_needs',
        onInsert: (newNeed) => {
            // Need to fetch worker name separately or invalidate query, but for now just add
            // Ideally we invalidate or refetch, but here we optimistically add if we have worker info in context
            // For simplicity, we trigger a refetch or toast
            toast.warning(`New training need identified: ${newNeed.training_area}`);
            fetchData();
        },
        onUpdate: (updatedNeed) => {
            setTrainingNeeds(prev => prev.map(n => n.id === updatedNeed.id ? { ...n, ...updatedNeed } : n));
        }
    });


    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-green-500";
        if (score >= 70) return "text-yellow-500";
        return "text-red-500";
    };

    if (loading) return <BrandedLoader fullPage />;

    const filteredWorkers = workers.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-4 lg:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white mb-2 flex items-center gap-3">
                        <Users className="text-[#ff1744]" /> Workforce Command
                    </h1>
                    <p className="text-[#888]">Monitor performance, training, and productivity</p>
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" size={16} />
                        <input
                            type="text"
                            placeholder="Search workers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-[#ff1744] outline-none w-64"
                        />
                    </div>
                    <button className="px-4 py-2 rounded-xl bg-[#ff1744] text-white font-bold uppercase text-xs tracking-wider flex items-center gap-2 shadow-lg shadow-[#ff1744]/20">
                        <Plus size={16} /> Add Worker
                    </button>
                </div>
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl w-fit">
                {(['overview', 'training', 'bonuses'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab
                                ? 'bg-[#ff1744] text-white font-bold shadow-lg shadow-[#ff1744]/25'
                                : 'text-[#888] hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWorkers.map((worker) => {
                        const perf = worker.performance?.[0] || {};
                        const rating = perf.average_rating || 0;
                        const services = perf.completed_services || 0;
                        const quality = perf.quality_score || 0;

                        return (
                            <div key={worker.id} className="glass-card rounded-2xl border border-white/5 overflow-hidden hover:border-[#ff1744]/30 transition-all group">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-xl font-bold text-[#ff1744] border-2 border-white/5 group-hover:border-[#ff1744] transition-colors">
                                                {worker.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-white">{worker.name}</h3>
                                                <div className="flex items-center gap-2 text-xs text-[#888]">
                                                    <span className="uppercase tracking-wider">{worker.role}</span>
                                                    <span className="w-1 h-1 rounded-full bg-[#888]" />
                                                    <span className={worker.status === 'active' ? 'text-green-500' : 'text-red-500'}>{worker.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1 text-[#d4af37] font-bold">
                                                <Star size={14} fill="currentColor" /> {rating.toFixed(1)}
                                            </div>
                                            <span className="text-[10px] text-[#666] uppercase tracking-wider">{perf.total_reviews || 0} reviews</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mb-6">
                                        <div className="bg-white/5 rounded-lg p-3 text-center">
                                            <div className="text-xs text-[#888] uppercase font-bold mb-1">Services</div>
                                            <div className="text-lg font-mono font-bold text-white">{services}</div>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-3 text-center">
                                            <div className="text-xs text-[#888] uppercase font-bold mb-1">Quality</div>
                                            <div className={`text-lg font-mono font-bold ${getScoreColor(quality)}`}>{quality.toFixed(0)}%</div>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-3 text-center">
                                            <div className="text-xs text-[#888] uppercase font-bold mb-1">On-Time</div>
                                            <div className={`text-lg font-mono font-bold ${getScoreColor(perf.on_time_percentage || 0)}`}>{(perf.on_time_percentage || 0).toFixed(0)}%</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs font-medium">
                                        <span className="text-[#666]">Revenue Generated</span>
                                        <span className="text-white font-mono">₹{(perf.total_revenue || 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="bg-white/5 p-3 flex justify-between items-center px-6">
                                    <button className="text-xs font-bold text-[#ff1744] uppercase tracking-wider hover:text-white transition-colors">View Profile</button>
                                    <button className="text-[#666] hover:text-white"><MoreVertical size={16} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === "training" && (
                <div className="space-y-6">
                    <div className="glass-card rounded-2xl border border-white/5 p-6 md:p-8">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <AlertTriangle className="text-orange-500" /> Identified Training Needs
                        </h2>
                        <div className="space-y-4">
                            {trainingNeeds.map((need: any) => (
                                <div key={need.id} className="bg-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-orange-500">
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">{need.worker?.name}</h3>
                                        <p className="text-sm text-[#ccc] mb-2">{need.identified_reason}</p>
                                        <div className="flex gap-2">
                                            <span className="px-2 py-1 rounded bg-white/10 text-xs font-bold uppercase tracking-wider text-[#888]">
                                                {need.training_area.replace(/_/g, ' ')}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${need.priority === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                                                }`}>
                                                {need.priority} priority
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider">
                                            Mark Scheduled
                                        </button>
                                        <button className="px-4 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-500 font-bold text-xs uppercase tracking-wider">
                                            Complete
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {trainingNeeds.length === 0 && (
                                <div className="text-center py-12 text-[#666]">
                                    <CheckCircle size={48} className="mx-auto mb-4 opacity-50 text-green-500" />
                                    <p>No training needs identified. Great job team!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "bonuses" && (
                <div className="glass-card rounded-2xl border border-white/5 p-12 text-center">
                    <Award size={48} className="mx-auto mb-4 text-[#d4af37]" />
                    <h2 className="text-xl font-bold text-white">Performance Bonuses</h2>
                    <p className="text-[#888] mt-2">Bonus approval workflow coming soon.</p>
                </div>
            )}
        </div>
    );
}
