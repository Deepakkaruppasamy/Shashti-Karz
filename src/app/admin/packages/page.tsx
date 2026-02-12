"use client";

import React, { useState, useEffect } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, X, Trash2, Star, Power, Edit3, Sparkles, RefreshCw, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/AdminSidebar";
import { BrandedLoader } from "@/components/animations/BrandedLoader";
import type { Service } from "@/lib/types";

interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  tier: string;
  price: number;
  service_ids: string[] | null;
  is_popular: boolean;
  active: boolean;
  created_at: string;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    tier: "standard",
    price: 0,
    service_ids: [] as string[],
    is_popular: false,
  });

  // Real-time subscription
  useRealtimeSubscription({
    table: "service_packages",
    onInsert: (newPkg) => {
      setPackages((prev) => [...prev, newPkg]);
      toast.success("New package added!");
    },
    onUpdate: (updatedPkg) => {
      setPackages((prev) => prev.map((p) => (p.id === updatedPkg.id ? updatedPkg : p)));
    },
    onDelete: (payload) => {
      setPackages((prev) => prev.filter((p) => p.id !== payload.old.id));
    },
  });

  useEffect(() => {
    loadData();
    generateAiInsights();
  }, []);

  const loadData = async () => {
    try {
      const [packagesRes, servicesRes] = await Promise.all([
        fetch("/api/packages"),
        fetch("/api/services"),
      ]);
      if (packagesRes.ok) setPackages(await packagesRes.json());
      if (servicesRes.ok) setServices(await servicesRes.json());
    } finally {
      setIsLoading(false);
    }
  };

  const generateAiInsights = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/admin-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "Analyze our service packages and suggest improvements based on industry trends. Suggest one high-value bundle.",
          context: { type: "packages", current_packages: packages }
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsight(data.response);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingPackage ? `/api/packages/${editingPackage.id}` : "/api/packages";
    const method = editingPackage ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success(editingPackage ? "Package updated!" : "Package created!");
      setShowModal(false);
      setEditingPackage(null);
      resetForm();
    } else {
      toast.error("Failed to save package");
    }
  };

  const resetForm = () => {
    setForm({ name: "", description: "", tier: "standard", price: 0, service_ids: [], is_popular: false });
  };

  const openEditModal = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setForm({
      name: pkg.name,
      description: pkg.description || "",
      tier: pkg.tier,
      price: pkg.price,
      service_ids: pkg.service_ids || [],
      is_popular: pkg.is_popular,
    });
    setShowModal(true);
  };

  const toggleActive = async (pkg: ServicePackage) => {
    await fetch(`/api/packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !pkg.active }),
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this package?")) return;
    await fetch(`/api/packages/${id}`, { method: "DELETE" });
  };

  const calculateBundlePrice = async () => {
    if (form.service_ids.length === 0) return;
    const res = await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "calculate_bundle", service_ids: form.service_ids }),
    });
    if (res.ok) {
      const data = await res.json();
      setForm({ ...form, price: data.bundle_price });
      toast.success(`Suggested price: ₹${data.bundle_price}`);
    }
  };

  const toggleService = (serviceId: string) => {
    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter((id) => id !== serviceId)
        : [...prev.service_ids, serviceId],
    }));
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "premium": return "bg-purple-500 border-purple-500/20";
      case "ultimate": return "bg-[#d4af37] border-[#d4af37]/20";
      default: return "bg-blue-500 border-blue-500/20";
    }
  };

  const stats = [
    { label: "Bundles", value: packages.length, icon: Package, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Live", value: packages.filter(p => p.active).length, icon: Power, color: "text-green-400", bg: "bg-green-400/10" },
    { label: "Prime", value: packages.filter(p => p.is_popular).length, icon: Star, color: "text-amber-400", bg: "bg-amber-400/10" },
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      <div className="flex-1 overflow-auto pb-24 lg:pb-8">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tighter">
                Bundle Matrix
              </h1>
              <p className="text-[#888] mt-1 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live Revenue Optimization
              </p>
            </div>
            <button
              onClick={() => { resetForm(); setEditingPackage(null); setShowModal(true); }}
              className="w-full md:w-auto btn-premium px-8 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#ff1744]/20 transition-all"
            >
              <Plus size={18} />
              New Master Bundle
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card rounded-2xl p-4 lg:p-6 border border-white/5 flex items-center gap-3 lg:gap-4 ${i === 2 ? 'col-span-2 lg:col-span-1' : ''}`}
              >
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                  <stat.icon size={18} className="lg:w-6 lg:h-6" />
                </div>
                <div>
                  <div className="text-xl lg:text-2xl font-black tracking-tighter truncate">{stat.value}</div>
                  <div className="text-[8px] lg:text-[10px] font-black text-[#666] uppercase tracking-widest truncate">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* AI Insights Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 lg:p-6 glass-card rounded-2xl lg:rounded-[2.5rem] border border-[#ff1744]/20 bg-gradient-to-r from-[#ff1744]/10 to-transparent flex flex-col sm:flex-row items-center gap-4 lg:gap-6"
          >
            <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-[1.5rem] bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center shrink-0 shadow-lg">
              <Sparkles className="text-white fill-white" size={24} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="font-black uppercase tracking-widest text-[10px] text-[#ff1744]">Neural Bundle Analyst</h2>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <button onClick={generateAiInsights} className="text-[10px] font-black underline uppercase text-[#888] hover:text-white transition-colors">Analyze Matrix</button>
              </div>
              <p className="text-xs lg:text-sm text-[#ccc] leading-relaxed italic">
                {isAiLoading ? "Processing historical sales clusters..." : (aiInsight || "Initiate analysis to optimize current service bundles.")}
              </p>
            </div>
          </motion.div>

          <div className="glass-card rounded-2xl lg:rounded-[2.5rem] p-4 lg:p-8 border border-white/5">
            {isLoading ? (
              <BrandedLoader className="py-20" />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {packages.map((pkg) => (
                  <motion.div
                    key={pkg.id}
                    layout
                    whileHover={{ y: -4 }}
                    className={`rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 border-2 relative transition-all duration-300 overflow-hidden flex flex-col ${pkg.active
                      ? "bg-white/[0.03] border-white/10 hover:border-[#ff1744]/50 shadow-2xl"
                      : "bg-white/[0.01] border-white/5 opacity-40 grayscale"
                      }`}
                  >
                    {pkg.is_popular && (
                      <div className="absolute top-6 right-6 z-10">
                        <div className="px-3 py-1 rounded-full bg-[#ff1744] text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-[#ff1744]/30">
                          <Star size={10} className="fill-white" />
                          Prime Choice
                        </div>
                      </div>
                    )}

                    <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-[1.25rem] ${getTierColor(pkg.tier)} flex items-center justify-center mb-6 shadow-xl`}>
                      <Package size={24} className="lg:w-8 lg:h-8 text-white" />
                    </div>

                    <div className="mb-4">
                      <h3 className="text-xl lg:text-2xl font-black mb-1 group-hover:text-[#ff1744] transition-colors truncate pr-16">{pkg.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${pkg.tier === 'ultimate' ? 'bg-[#d4af37] text-black' : 'bg-white/10 text-white/60'}`}>{pkg.tier}</span>
                        <span className="text-[8px] text-[#444] font-black uppercase tracking-widest">v{pkg.id.slice(0, 4)}</span>
                      </div>
                    </div>

                    <p className="text-xs lg:text-sm text-[#888] mb-6 line-clamp-2 leading-relaxed font-medium min-h-[40px]">
                      {pkg.description || "No specific configuration data provided."}
                    </p>

                    <div className="mt-auto mb-8 flex items-baseline gap-1">
                      <span className="text-xs font-bold text-[#555]">₹</span>
                      <span className="text-3xl lg:text-4xl font-black tracking-tighter text-white">
                        {pkg.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-6 border-t border-white/5">
                      <button
                        onClick={() => openEditModal(pkg)}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all"
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => toggleActive(pkg)}
                        className={`p-3 rounded-xl transition-all ${pkg.active ? "bg-green-500/10 text-green-500" : "bg-white/5 text-[#444]"}`}
                      >
                        <Power size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        className="p-3 rounded-xl bg-red-500/10 text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simplified Modal for Admin with responsive focus */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md" onClick={() => setShowModal(false)}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-2xl bg-[#0d0d0d] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[3rem] p-6 lg:p-10 shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff1744]/10 rounded-full blur-[100px] -z-1" />

              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-black tracking-tighter">{editingPackage ? "Edit Matrix" : "New Bundle"}</h2>
                  <p className="text-[10px] font-black text-[#555] uppercase tracking-widest mt-1">Configure Revenue Dynamics</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-3 bg-white/5 rounded-2xl border border-white/5"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#444] uppercase tracking-widest">Master Concept</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      placeholder="e.g. ULTIMATE REBIRTH"
                      className="w-full px-5 py-4 lg:py-5 rounded-2xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none font-bold text-sm lg:text-base"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#444] uppercase tracking-widest">Exclusivity Tier</label>
                    <select
                      value={form.tier}
                      onChange={(e) => setForm({ ...form, tier: e.target.value })}
                      className="w-full px-5 py-4 lg:py-5 rounded-2xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none font-black uppercase text-xs tracking-widest appearance-none"
                    >
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="ultimate">Ultimate</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[#444] uppercase tracking-widest">Context Summary</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Define the value proposition..."
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none h-24 text-sm"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-[#444] uppercase tracking-widest">Core Components</label>
                    <span className="text-[10px] font-black text-[#ff1744] uppercase tracking-widest">{form.service_ids.length} Active</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                    {services.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleService(s.id)}
                        className={`p-3 rounded-xl border text-[9px] font-black uppercase text-left transition-all ${form.service_ids.includes(s.id)
                          ? "bg-[#ff1744] border-[#ff1744] text-white"
                          : "bg-white/5 border-white/5 text-[#555]"
                          }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                  <div className="space-y-3">
                    <div className="flex justify-between px-1">
                      <label className="text-[10px] font-black text-[#444] uppercase tracking-widest">Price Vector (₹)</label>
                      <button
                        type="button"
                        onClick={calculateBundlePrice}
                        className="text-[9px] font-black text-[#d4af37] uppercase tracking-tighter hover:underline"
                      >
                        Calculate suggest
                      </button>
                    </div>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) })}
                      className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none text-2xl font-black tracking-tighter"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_popular: !form.is_popular })}
                    className={`h-14 lg:h-[68px] px-6 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest ${form.is_popular
                      ? "bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]"
                      : "bg-white/5 border-transparent text-[#444]"
                      }`}
                  >
                    <Star size={16} className={form.is_popular ? "fill-[#d4af37]" : ""} />
                    Prime Spotlight
                  </button>
                </div>

                <div className="flex gap-3 pt-6 lg:pt-8">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 lg:py-5 rounded-2xl bg-white/5 text-[#666] font-black uppercase text-[10px] tracking-widest"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-4 lg:py-5 rounded-2xl bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-[#ff1744]/20"
                  >
                    {editingPackage ? "Force Sync Changes" : "Initialize Master Bundle"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  );
}
