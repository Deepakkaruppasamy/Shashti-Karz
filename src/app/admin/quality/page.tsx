"use client";

import { useState, useEffect } from "react";
import {
    ClipboardCheck,
    Plus,
    Search,
    CheckCircle,
    AlertTriangle,
    FileText,
    Trash2,
    Eye,
    ChevronRight,
    ShieldCheck,
    List
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { BrandedLoader } from "@/components/animations/BrandedLoader";

export default function QualityAdminPage() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"checklists" | "inspections">("checklists");
    const [checklists, setChecklists] = useState<any[]>([]);
    const [inspections, setInspections] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);

    // Mock data for initial render if DB is empty
    const MOCK_CHECKLISTS = [
        { id: '1', name: 'Standard Wash Inspection', items_count: 12, service_type: 'Wash', active: true },
        { id: '2', name: 'Premium Detail QC', items_count: 25, service_type: 'Detailing', active: true },
        { id: '3', name: 'Ceramic Coating Validation', items_count: 40, service_type: 'Coating', active: true },
    ];

    const MOCK_INSPECTIONS = [
        { id: '1', booking_id: 'BK-1234', worker: 'Dinesh Kumar', status: 'passed', score: 98, date: '2024-02-12T10:00:00Z' },
        { id: '2', booking_id: 'BK-1235', worker: 'Rahul Singh', status: 'failed', score: 65, date: '2024-02-12T11:30:00Z' },
    ];

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: clData } = await supabase.from('quality_checklists').select('*');
            if (clData && clData.length > 0) setChecklists(clData);
            else setChecklists(MOCK_CHECKLISTS);

            const { data: inspData } = await supabase.from('completed_checklists').select('*');
            if (inspData && inspData.length > 0) setInspections(inspData);
            else setInspections(MOCK_INSPECTIONS);

        } catch (error) {
            console.error('Error loading quality data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <BrandedLoader fullPage />;

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-4 lg:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white mb-2 flex items-center gap-3">
                        <ShieldCheck className="text-green-500" /> Quality Control
                    </h1>
                    <p className="text-[#888]">Standard operating procedures and inspection reports</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab("checklists")}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "checklists"
                                ? 'bg-green-500 text-black font-bold shadow-lg shadow-green-500/25'
                                : 'text-[#888] hover:text-white hover:bg-white/5'
                            }`}
                    >
                        SOP Checklists
                    </button>
                    <button
                        onClick={() => setActiveTab("inspections")}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "inspections"
                                ? 'bg-green-500 text-black font-bold shadow-lg shadow-green-500/25'
                                : 'text-[#888] hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Inspection Reports
                    </button>
                </div>
            </div>

            {activeTab === "checklists" && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button className="px-4 py-2 rounded-xl bg-green-500 text-black font-bold uppercase text-xs tracking-wider flex items-center gap-2 hover:bg-green-400">
                            <Plus size={16} /> New Checklist
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {checklists.map((list) => (
                            <div key={list.id} className="glass-card p-6 rounded-2xl border border-white/5 hover:border-green-500/30 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full blur-xl -mr-10 -mt-10" />

                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-white/5 rounded-xl text-green-500">
                                        <ClipboardCheck size={24} />
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${list.active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {list.active ? 'Active' : 'Draft'}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1">{list.name}</h3>
                                <p className="text-sm text-[#888] mb-6">{list.service_type} Protocol</p>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-sm text-[#ccc]">
                                        <List size={16} className="text-green-500" />
                                        {list.items_count} Checkpoints
                                    </div>
                                    <button className="text-xs font-bold text-green-500 uppercase tracking-wider hover:text-white">Edit Items</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "inspections" && (
                <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h2 className="text-lg font-bold">Recent Inspections</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" size={14} />
                            <input placeholder="Search booking ID..." className="pl-9 pr-4 py-2 bg-white/5 rounded-lg text-sm border border-white/10 focus:border-green-500 outline-none" />
                        </div>
                    </div>

                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Booking</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Worker</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Score</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Result</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#888] uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {inspections.map((insp) => (
                                <tr key={insp.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-mono text-white">{insp.booking_id}</td>
                                    <td className="px-6 py-4 text-white font-medium">{insp.worker}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-white/10 rounded-full w-20 overflow-hidden">
                                                <div className={`h-full rounded-full ${insp.score >= 90 ? 'bg-green-500' : insp.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${insp.score}%` }} />
                                            </div>
                                            <span className="text-xs font-bold">{insp.score}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${insp.status === 'passed' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                            }`}>
                                            {insp.status}
                                        </span>
                                        {insp.status === 'failed' && <AlertTriangle size={12} className="inline ml-2 text-red-500" />}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-[#888]">
                                        {new Date(insp.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="p-2 hover:bg-white/10 rounded-lg text-[#ccc]"><Eye size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
