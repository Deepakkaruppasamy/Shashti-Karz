"use client";

import React, { useState, useEffect } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, X, Trash2, Star, Power, Edit3, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/AdminSidebar";
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
      // No need to loadData() because realtime will handle it
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
      toast.success(`Bundle price: ₹${data.bundle_price} (${data.bundle_discount}% off)`);
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
      case "premium": return "from-purple-500 to-pink-500";
      case "ultimate": return "from-[#d4af37] to-[#ffd700]";
      default: return "from-blue-500 to-cyan-500";
    }
  };

  const stats = [
    { label: "Total Packages", value: packages.length, icon: Package, color: "from-blue-500 to-indigo-500" },
    { label: "Active", value: packages.filter(p => p.active).length, icon: Power, color: "from-emerald-500 to-teal-500" },
    { label: "Popular", value: packages.filter(p => p.is_popular).length, icon: Star, color: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                Service Packages
              </h1>
              <p className="text-[#888] mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live: Command Center for Sales Bundles
              </p>
            </div>
            <button
              onClick={() => { resetForm(); setEditingPackage(null); setShowModal(true); }}
              className="btn-premium px-8 py-4 rounded-2xl text-white font-bold flex items-center gap-3 shadow-xl shadow-[#ff1744]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus size={20} />
              New Package
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-3xl p-6 border border-white/5 relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity blur-2xl`} />
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <div className="text-3xl font-black tracking-tighter">{stat.value}</div>
                <div className="text-sm font-bold text-[#888] uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* AI Insights Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 glass-card rounded-3xl p-6 border border-[#ff1744]/20 relative overflow-hidden bg-[#ff1744]/5"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-[#ff1744] to-[#d4af37] rounded-xl shadow-lg shadow-[#ff1744]/20">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">AI Bundle Analyst</h2>
                <p className="text-xs text-[#888]">Real-time package & revenue optimization</p>
              </div>
              <button
                onClick={generateAiInsights}
                className="ml-auto p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <RefreshCw size={16} className={isAiLoading ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="text-sm leading-relaxed text-[#ccc] min-h-[40px]">
              {isAiLoading ? (
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-[#ff1744]" />
                  <span>Scanning customer behavior and current trends...</span>
                </div>
              ) : (
                aiInsight || "No insights generated yet. Click the refresh icon to analyze."
              )}
            </div>
          </motion.div>

          {/* Packages Grid */}
          <div className="glass-card rounded-3xl p-8 border border-white/5">
            {isLoading ? (
              <div className="text-center py-24">
                <div className="w-12 h-12 border-4 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[#888] font-medium">Syncing with Shashti Cloud...</p>
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-24 text-[#888]">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <Package size={40} className="opacity-20" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Packages Yet</h3>
                <p className="max-w-xs mx-auto mb-8 text-sm">Created bundles will appear here and update instantly across all customer devices.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
                >
                  Create Your First Bundle
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {packages.map((pkg) => (
                  <motion.div
                    key={pkg.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`group rounded-[2.5rem] p-8 border-2 relative transition-all duration-500 overflow-hidden ${pkg.active
                      ? "bg-white/[0.03] border-white/10 hover:border-[#ff1744]/50 shadow-2xl hover:shadow-[#ff1744]/10"
                      : "bg-white/[0.01] border-white/5 opacity-50 grayscale"
                      }`}
                  >
                    {/* Glossy Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    {pkg.is_popular && (
                      <div className="absolute top-6 right-6 z-10">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="px-4 py-1.5 rounded-full bg-[#ff1744] text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5 shadow-lg shadow-[#ff1744]/30"
                        >
                          <Star size={10} className="fill-white" />
                          Most Booked
                        </motion.div>
                      </div>
                    )}

                    <div className={`w-16 h-16 rounded-[1.25rem] bg-gradient-to-br ${getTierColor(pkg.tier)} flex items-center justify-center mb-6 shadow-2xl shadow-black/40 group-hover:scale-110 transition-transform duration-500`}>
                      <Package size={32} className="text-white" />
                    </div>

                    <div className="mb-4">
                      <h3 className="text-2xl font-black mb-1 group-hover:text-[#ff1744] transition-colors">{pkg.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded bg-gradient-to-r ${getTierColor(pkg.tier)} text-[10px] font-black uppercase tracking-widest text-black`}>{pkg.tier}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[10px] text-[#666] font-bold uppercase tracking-widest">v{pkg.id.slice(0, 4)}</span>
                      </div>
                    </div>

                    {pkg.description ? (
                      <p className="text-sm text-[#888] mb-6 line-clamp-3 leading-relaxed font-medium">
                        {pkg.description}
                      </p>
                    ) : (
                      <p className="text-sm italic text-[#444] mb-6">No description provided...</p>
                    )}

                    <div className="mb-8 flex items-baseline gap-2">
                      <span className="text-sm font-bold text-[#888]">₹</span>
                      <span className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        {pkg.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-6 border-t border-white/10 group-hover:border-white/20 transition-colors">
                      <button
                        onClick={() => openEditModal(pkg)}
                        className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center gap-2 text-sm font-bold transition-all"
                      >
                        <Edit3 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => toggleActive(pkg)}
                        className={`p-3 rounded-2xl transition-all ${pkg.active ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-white/5 text-[#888] border border-white/10"}`}
                        title={pkg.active ? "Deactivate" : "Activate"}
                      >
                        <Power size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        className="p-3 rounded-2xl bg-red-500/5 text-red-500/50 hover:text-red-500 border border-white/5 hover:border-red-500/20 transition-all"
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

      {/* Modern Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-xl"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 md:p-12">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">{editingPackage ? "Edit Package" : "Create Package"}</h2>
                    <p className="text-[#888] text-sm mt-1">Configure your premium car detailing bundle</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em] ml-1">Package Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        placeholder="e.g. Royal treatment 👑"
                        className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10 focus:border-[#ff1744] focus:outline-none transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em] ml-1">Tier</label>
                      <select
                        value={form.tier}
                        onChange={(e) => setForm({ ...form, tier: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10 focus:border-[#ff1744] focus:outline-none transition-all font-bold appearance-none"
                      >
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="ultimate">Ultimate</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em] ml-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="What makes this package special?"
                      className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10 focus:border-[#ff1744] focus:outline-none transition-all h-24 font-medium"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em] ml-1">Include Services</label>
                      <span className="text-[10px] font-bold text-[#ff1744]">{form.service_ids.length} Selected</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {services.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleService(s.id)}
                          className={`p-3 rounded-xl border text-[10px] font-black uppercase text-left transition-all ${form.service_ids.includes(s.id)
                            ? "bg-[#ff1744] border-[#ff1744] text-white shadow-lg shadow-[#ff1744]/20"
                            : "bg-white/5 border-white/5 text-[#888] hover:border-white/20"
                            }`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em] ml-1">Pricing (₹)</label>
                        <button
                          type="button"
                          onClick={calculateBundlePrice}
                          className="text-[10px] font-black text-[#d4af37] uppercase tracking-tighter hover:underline"
                        >
                          Suggest Bundle Price
                        </button>
                      </div>
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) })}
                        className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10 focus:border-[#ff1744] focus:outline-none text-2xl font-black tracking-tight"
                      />
                    </div>
                    <div className="pb-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, is_popular: !form.is_popular })}
                        className={`w-full px-6 py-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 font-black text-sm ${form.is_popular
                          ? "bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]"
                          : "bg-white/5 border-transparent text-[#666]"
                          }`}
                      >
                        <Star size={18} className={form.is_popular ? "fill-[#d4af37]" : ""} />
                        MOST POPULAR TAG
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-8 py-5 rounded-2xl bg-white/5 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-[2] px-8 py-5 rounded-2xl bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-[#ff1744]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      {editingPackage ? "Save Changes" : "Create Master Bundle"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
