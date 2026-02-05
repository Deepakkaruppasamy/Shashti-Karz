"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2,
    Car,
    Calendar,
    BarChart3,
    Settings,
    ShieldCheck,
    Zap,
    ChevronRight,
    CheckCircle2,
    Clock,
    LayoutDashboard,
    ArrowLeft,
    Users,
    AlertCircle,
    Plus,
    ArrowRight,
    TrendingUp,
    Download
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CarLoader, ProgressLoader } from "@/components/animations/CarLoader";
import { MorphingCard } from "@/components/animations/MorphingCard";
import { ShimmerCard } from "@/components/animations/AdvancedShimmer";
import { toast } from "sonner";
import Link from "next/link";

type Tab = "overview" | "inventory" | "operations" | "billing";

export default function FleetOperationsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showBulkWizard, setShowBulkWizard] = useState(false);
    const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);

    // Bulk Booking State
    const [bulkBookingStep, setBulkBookingStep] = useState(1);
    const [bulkForm, setBulkForm] = useState({
        service_id: "express-wash",
        date: "",
        time: "09:00 AM",
        notes: ""
    });

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/fleet/analytics/${id}`);
            const json = await res.json();
            setData(json);
        } catch (error) {
            toast.error("Failed to load fleet command center");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleBulkBooking = async () => {
        try {
            const res = await fetch("/api/fleet/bulk-booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fleet_id: id,
                    vehicle_ids: selectedVehicles,
                    ...bulkForm
                })
            });

            if (res.ok) {
                toast.success(`Mission Successful: ${selectedVehicles.length} vehicles scheduled.`);
                setShowBulkWizard(false);
                fetchData();
            } else {
                toast.error("Bulk deployment failed");
            }
        } catch (error) {
            toast.error("Critical system error during deployment");
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><CarLoader /></div>;
    if (!data?.fleet) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Fleet Not Found</div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <Navbar />

            <main className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
                {/* HUD Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div className="flex items-center gap-6">
                        <Link href="/fleet" className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#888]">Operations Center</span>
                            </div>
                            <h1 className="text-3xl font-black italic tracking-tighter uppercase">{data.fleet.company_name} <span className="text-[#ff1744]">HQ</span></h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowBulkWizard(true)}
                            className="btn-premium px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2"
                        >
                            <Zap size={16} />
                            Rapid Deployment
                        </button>
                        <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-[#888] hover:text-white transition-all">
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                {/* Dashboard Navigation */}
                <nav className="flex gap-4 mb-10 border-b border-white/5 pb-4 overflow-x-auto no-scrollbar">
                    {[
                        { id: "overview", label: "Fleet Intelligence", icon: LayoutDashboard },
                        { id: "inventory", label: "Asset Monitor", icon: Car },
                        { id: "operations", label: "Live Missions", icon: Zap },
                        { id: "billing", label: "Invoicing", icon: BarChart3 },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as Tab)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === item.id
                                    ? "bg-white/10 text-white border border-white/20"
                                    : "text-[#444] hover:text-[#888]"
                                }`}
                        >
                            <item.icon size={14} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                {activeTab === "overview" && (
                    <div className="space-y-8">
                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: "Fleet Strength", value: data.totalVehicles, sub: "Vehicles", icon: Car, color: "text-blue-500" },
                                { label: "Fleet Health", value: `${data.fleetHealth}%`, sub: "Operational", icon: ShieldCheck, color: "text-green-500" },
                                { label: "Active Services", value: data.completedBookings, sub: "This Month", icon: Zap, color: "text-[#ff1744]" },
                                { label: "Total Investment", value: `₹${data.totalSpent.toLocaleString()}`, sub: "LTV", icon: TrendingUp, color: "text-[#d4af37]" },
                            ].map((stat, i) => (
                                <div key={i} className="glass-card rounded-[2rem] p-6 border border-white/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                                            <stat.icon size={20} />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-black italic tracking-tighter">{stat.value}</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#444] mt-1">{stat.label}</p>
                                    <p className="text-[8px] font-bold text-[#888] mt-4 flex items-center gap-1">
                                        <Clock size={8} /> {stat.sub}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Health Grid */}
                            <div className="lg:col-span-2 glass-card rounded-[3rem] p-8 border border-white/5">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-sm font-black uppercase tracking-[0.3em]">Vehicle Health Monitor</h3>
                                    <span className="text-[10px] font-bold text-[#888]">LAST SCAN: JUST NOW</span>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    {data.vehicles.map((vehicle: any, i: number) => {
                                        const health = Math.floor(Math.random() * 30) + 70; // Mock health for now
                                        return (
                                            <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-[#ff1744]/20 transition-colors">
                                                            <Car size={18} className="text-[#888] group-hover:text-[#ff1744]" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-bold uppercase">{vehicle.brand} {vehicle.model}</h4>
                                                            <p className="text-[8px] font-black text-[#444] tracking-widest">{vehicle.number_plate}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[10px] font-black ${health > 90 ? 'text-green-500' : 'text-yellow-500'}`}>{health}%</span>
                                                </div>
                                                <ProgressLoader progress={health} className="h-1" />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Maintenance Feed */}
                            <div className="glass-card rounded-[3rem] p-8 border border-white/5">
                                <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8">Service History</h3>
                                <div className="space-y-6">
                                    {data.recentBookings.map((booking: any, i: number) => (
                                        <div key={i} className="flex gap-4 relative">
                                            {i < data.recentBookings.length - 1 && <div className="absolute left-2.5 top-8 bottom-0 w-px bg-white/5" />}
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 ${booking.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                                                }`}>
                                                {booking.status === 'completed' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">{booking.car_model}</p>
                                                <p className="text-[8px] font-bold text-[#888] uppercase">{booking.service_id.replace('-', ' ')} • {booking.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {data.recentBookings.length === 0 && (
                                        <div className="text-center py-10">
                                            <Car className="mx-auto text-[#222] mb-4" size={40} />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#444]">No activity logs found</p>
                                        </div>
                                    )}
                                </div>

                                <button className="w-full mt-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                                    Full Audit Log
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk Deployment Wizard Overlay */}
                <AnimatePresence>
                    {showBulkWizard && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
                            onClick={() => setShowBulkWizard(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="w-full max-w-4xl bg-[#0a0a0a] rounded-[3rem] border border-white/10 overflow-hidden relative"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Wizard Header */}
                                <div className="bg-white/5 p-8 flex justify-between items-center border-b border-white/5">
                                    <div>
                                        <span className="text-[10px] font-black text-[#ff1744] uppercase tracking-[0.4em] mb-2 block">Enterprise Scheduler</span>
                                        <h2 className="text-3xl font-black italic tracking-tighter uppercase">BULK DEPLOYMENT <span className="text-[#ff1744]">WIZARD</span></h2>
                                    </div>
                                    <button onClick={() => setShowBulkWizard(false)} className="p-4 rounded-full bg-white/5 hover:bg-white/10">
                                        <LayoutDashboard size={20} />
                                    </button>
                                </div>

                                <div className="grid lg:grid-cols-5 h-[600px]">
                                    {/* Sidebar Steps */}
                                    <div className="lg:col-span-1 border-r border-white/5 p-6 bg-white/[0.02]">
                                        {[
                                            { step: 1, label: "Selection", icon: Car },
                                            { step: 2, label: "Protocol", icon: Zap },
                                            { step: 3, label: "Strategic", icon: Calendar },
                                            { step: 4, label: "Deployment", icon: ShieldCheck },
                                        ].map((s) => (
                                            <div key={s.step} className={`flex items-center gap-4 mb-8 ${bulkBookingStep === s.step ? 'text-white' : 'text-[#444]'}`}>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${bulkBookingStep === s.step ? 'border-[#ff1744] bg-[#ff1744]/10' : 'border-white/5'
                                                    }`}>
                                                    <s.icon size={16} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">{s.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Wizard Content */}
                                    <div className="lg:col-span-4 p-8 overflow-y-auto">
                                        {bulkBookingStep === 1 && (
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-bold uppercase tracking-widest mb-6">Select Assets for Maintenance</h3>
                                                <div className="grid sm:grid-cols-2 gap-4">
                                                    {data.vehicles.map((v: any) => (
                                                        <button
                                                            key={v.id}
                                                            onClick={() => {
                                                                setSelectedVehicles(prev =>
                                                                    prev.includes(v.id) ? prev.filter(id => id !== v.id) : [...prev, v.id]
                                                                );
                                                            }}
                                                            className={`p-4 rounded-2xl border transition-all text-left flex justify-between items-center ${selectedVehicles.includes(v.id)
                                                                    ? 'border-[#ff1744] bg-[#ff1744]/5'
                                                                    : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                                                                }`}
                                                        >
                                                            <div>
                                                                <h4 className="text-xs font-bold uppercase">{v.brand} {v.model}</h4>
                                                                <p className="text-[10px] text-[#888]">{v.number_plate}</p>
                                                            </div>
                                                            {selectedVehicles.includes(v.id) && <CheckCircle2 className="text-[#ff1744]" size={16} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {bulkBookingStep === 2 && (
                                            <div className="space-y-8">
                                                <h3 className="text-xl font-bold uppercase tracking-widest mb-6">Execution Protocol</h3>
                                                <div className="grid gap-4">
                                                    {[
                                                        { id: "express-wash", name: "Strategic Express Wash", desc: "Rapid exterior cleaning for daily fleets", price: 300 },
                                                        { id: "fleet-detail", name: "Corporate Interior Detail", desc: "Full sanitation and cabin restoration", price: 1200 },
                                                        { id: "platinum-protection", name: "Ultimate Protection Plan", desc: "Ceramic top-up and wheel preservation", price: 4500 },
                                                    ].map((s) => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => setBulkForm({ ...bulkForm, service_id: s.id })}
                                                            className={`p-6 rounded-3xl border transition-all text-left flex justify-between items-center ${bulkForm.service_id === s.id
                                                                    ? 'border-[#ff1744] bg-[#ff1744]/5'
                                                                    : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                                                                }`}
                                                        >
                                                            <div>
                                                                <h4 className="text-sm font-black uppercase text-white">{s.name}</h4>
                                                                <p className="text-xs text-[#888]">{s.desc}</p>
                                                            </div>
                                                            <span className="text-[#d4af37] font-black">₹{s.price}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {bulkBookingStep === 3 && (
                                            <div className="space-y-8">
                                                <h3 className="text-xl font-bold uppercase tracking-widest mb-6">Strategic Timing</h3>
                                                <div className="grid md:grid-cols-2 gap-8">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#444] mb-2 block">Target Date</label>
                                                        <input
                                                            type="date"
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-[#ff1744] outline-none"
                                                            value={bulkForm.date}
                                                            onChange={e => setBulkForm({ ...bulkForm, date: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#444] mb-2 block">Preferred Window</label>
                                                        <select
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-[#ff1744] outline-none"
                                                            value={bulkForm.time}
                                                            onChange={e => setBulkForm({ ...bulkForm, time: e.target.value })}
                                                        >
                                                            <option>09:00 AM</option>
                                                            <option>11:00 AM</option>
                                                            <option>02:00 PM</option>
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#444] mb-2 block">Field Intelligence (Notes)</label>
                                                        <textarea
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-[#ff1744] outline-none h-32 resize-none"
                                                            placeholder="Special entry instructions, garage codes, or tactical requirements..."
                                                            value={bulkForm.notes}
                                                            onChange={e => setBulkForm({ ...bulkForm, notes: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {bulkBookingStep === 4 && (
                                            <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                                                <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
                                                    <ShieldCheck size={48} className="text-green-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-4">READY FOR DEPLOYMENT</h3>
                                                    <p className="text-[#888] max-w-sm">Confirm strategic alignment for {selectedVehicles.length} assets. All bookings will be processed for {bulkForm.date} at {bulkForm.time}.</p>
                                                </div>

                                                <div className="grid grid-cols-3 gap-8 w-full max-w-lg p-6 bg-white/[0.02] rounded-[2rem] border border-white/5">
                                                    <div>
                                                        <p className="text-[8px] font-black text-[#444] uppercase tracking-widest mb-1">ASSETS</p>
                                                        <p className="text-xl font-black">{selectedVehicles.length}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-[#444] uppercase tracking-widest mb-1">PROGRAM</p>
                                                        <p className="text-[10px] font-black">{bulkForm.service_id.toUpperCase().split('-')[0]}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-[#444] uppercase tracking-widest mb-1">EST. VAL</p>
                                                        <p className="text-xl font-black text-[#d4af37]">ROI</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Wizard Footer */}
                                <div className="bg-white/5 p-8 flex justify-between items-center border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        {selectedVehicles.length > 0 && (
                                            <span className="px-3 py-1 rounded-full bg-[#ff1744]/10 text-[#ff1744] text-[8px] font-black uppercase tracking-widest">
                                                {selectedVehicles.length} SELECTIONS ACTIVE
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-4">
                                        {bulkBookingStep > 1 && (
                                            <button
                                                onClick={() => setBulkBookingStep(s => s - 1)}
                                                className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 font-black uppercase text-[10px] tracking-widest transition-all"
                                            >
                                                Previous
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                if (bulkBookingStep < 4) {
                                                    if (bulkBookingStep === 1 && selectedVehicles.length === 0) {
                                                        toast.error("Tactical Error: Select at least one asset");
                                                        return;
                                                    }
                                                    setBulkBookingStep(s => s + 1);
                                                } else {
                                                    handleBulkBooking();
                                                }
                                            }}
                                            className="btn-premium px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3"
                                        >
                                            {bulkBookingStep === 4 ? "CONFIRM DEPLOYMENT" : "NEXT PHASE"}
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <Footer />
        </div>
    );
}
