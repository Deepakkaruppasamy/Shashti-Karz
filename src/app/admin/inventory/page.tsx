"use client";

import React, { useState, useEffect } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
  Sparkles, Brain, Zap, Activity, RefreshCw, BarChart3, TrendingUp, TrendingDown, Target, ShieldCheck, ShoppingCart, Box, Layers, History,
  Plus, AlertTriangle, RotateCcw, Trash2, X, ChevronRight
} from "lucide-react";

import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { InventoryItem } from "@/lib/types";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState(0);
  const [filter, setFilter] = useState<"all" | "low">("all");
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "chemicals",
    unit: "liters",
    current_stock: 0,
    min_stock_threshold: 10,
    cost_per_unit: 0,
  });

  // Real-time subscription
  useRealtimeSubscription<any>({
    table: "inventory",
    onInsert: (newItem) => {
      const mapped = {
        ...newItem,
        current_stock: newItem.quantity,
        min_stock_threshold: newItem.min_quantity,
        cost_per_unit: newItem.price_per_unit
      };
      setItems(prev => [...prev, mapped]);
      toast.success(`New item added: ${newItem.name}`);
    },
    onUpdate: (updatedItem) => {
      const mapped = {
        ...updatedItem,
        current_stock: updatedItem.quantity,
        min_stock_threshold: updatedItem.min_quantity,
        cost_per_unit: updatedItem.price_per_unit
      };
      setItems(prev => prev.map(i => i.id === mapped.id ? mapped : i));
    },
    onDelete: (payload) => {
      setItems(prev => prev.filter(i => i.id !== payload.old.id));
    }
  });

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (items.length > 0 && !aiInsight) {
      generateAiInsight();
    }
  }, [items]);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/inventory");
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAiInsight = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/admin-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "Analyze current inventory levels. Identify items at highest risk of stockout and suggest an optimized purchase order for next week based on current burn rate.",
          context: {
            type: "inventory_analysis",
            items: items.map(i => ({ name: i.name, stock: i.current_stock, min: i.min_stock_threshold, unit: i.unit }))
          }
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsight(data.response);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        toast.success("Inventory item initialized!");
        setShowModal(false);
        setForm({ name: "", category: "chemicals", unit: "liters", current_stock: 0, min_stock_threshold: 10, cost_per_unit: 0 });
      }
    } catch (error) {
      toast.error("Deployment failed");
    }
  };

  const handleRestock = async () => {
    if (!selectedItem || restockQty <= 0) return;
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restock", item_id: selectedItem.id, quantity: restockQty }),
      });
      if (response.ok) {
        toast.success(`Injected ${restockQty} units into ${selectedItem.name}`);
        setShowRestockModal(false);
        setSelectedItem(null);
        setRestockQty(0);
      }
    } catch (error) {
      toast.error("Restock sequence interrupted");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Decommission this item permanently?")) return;
    try {
      const response = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Item decommissioned");
      }
    } catch (error) {
      toast.error("Decommissioning failed");
    }
  };

  const filteredItems = filter === "low"
    ? items.filter(i => i.current_stock <= i.min_stock_threshold)
    : items;

  const lowStockCount = items.filter(i => i.current_stock <= i.min_stock_threshold).length;
  const totalValue = items.reduce((sum, i) => sum + (i.current_stock * i.cost_per_unit), 0);
  const outOfStockCount = items.filter(i => i.current_stock === 0).length;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">

      <div className="flex-1 overflow-auto pb-24 lg:pb-8">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tighter flex items-center gap-3">
                <Layers className="text-[#ff1744]" />
                Resource Engine
              </h1>
              <p className="text-[#888] mt-1 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live Inventory Stream
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="w-full md:w-auto btn-premium px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <Plus size={16} />
              Provision Resource
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Assets", value: items.length, icon: Box, color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Critical", value: lowStockCount, icon: AlertTriangle, color: lowStockCount > 0 ? "text-red-500" : "text-green-500", bg: lowStockCount > 0 ? "bg-red-500/10" : "bg-green-500/10" },
                { label: "Net Value", value: `₹${totalValue.toLocaleString()}`, icon: TrendingUp, color: "text-[#d4af37]", bg: "bg-[#d4af37]/10" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`glass-card rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/5 relative overflow-hidden group ${i === 2 ? 'col-span-2 sm:col-span-1' : ''}`}
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-[40px] opacity-20`} />
                  <div className="relative flex items-center gap-3 lg:gap-4">
                    <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                      <stat.icon size={18} className="lg:w-5 lg:h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg lg:text-2xl font-black tracking-tighter truncate">{stat.value}</div>
                      <div className="text-[8px] lg:text-[10px] font-black text-[#555] uppercase tracking-widest truncate">{stat.label}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="col-span-2 lg:col-span-1">
              <div className="glass-card rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-[#ff1744]/20 bg-[#ff1744]/5 flex items-center gap-3 lg:gap-4 h-full">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-red-500 text-white flex items-center justify-center animate-pulse shrink-0">
                  <AlertTriangle size={18} className="lg:w-5 lg:h-5" />
                </div>
                <div>
                  <div className="text-lg lg:text-2xl font-black text-red-500 tracking-tighter">{outOfStockCount}</div>
                  <div className="text-[8px] lg:text-[10px] font-black text-red-500/60 uppercase tracking-widest">Depleted</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                <h3 className="text-[10px] font-black text-[#555] uppercase tracking-[0.3em]">Universal Registry</h3>
                <div className="flex gap-2 p-1 glass-card rounded-xl border border-white/5 bg-white/5 overflow-x-auto no-scrollbar">
                  {(["all", "low"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`flex-1 sm:flex-initial whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? "bg-white text-[#0a0a0a]" : "text-[#888] hover:text-white"}`}
                    >
                      {f === 'all' ? 'All Assets' : 'Emergency Restock'}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#444]">Syncing Neural Net...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((item) => {
                    const isLow = item.current_stock <= item.min_stock_threshold;
                    const percentage = Math.min(100, (item.current_stock / (item.min_stock_threshold * 2)) * 100);

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`glass-card rounded-2xl lg:rounded-[2rem] p-4 lg:p-6 border-2 transition-all group ${isLow ? "border-red-500/30 bg-red-500/5" : "border-white/5 bg-white/[0.02]"}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 relative">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-[1.2rem] flex items-center justify-center shrink-0 border transition-colors ${isLow ? "bg-red-500/20 border-red-500/30 text-red-500" : "bg-white/5 border-white/5 text-[#d4af37]"}`}>
                              <Box size={24} className="lg:w-7 lg:h-7" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-black text-base lg:text-lg tracking-tight truncate">{item.name}</h4>
                                <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest border shrink-0 ${isLow ? 'bg-red-500/20 text-red-500 border-red-500/20' : 'bg-green-500/20 text-green-500 border-green-500/20'}`}>
                                  {isLow ? 'Critical' : 'Operational'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[9px] font-bold text-[#555] uppercase tracking-widest">
                                <span className="flex items-center gap-1"><Layers size={10} /> {item.category}</span>
                                <span className="flex items-center gap-1"><History size={10} /> {item.unit}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6 sm:pl-6 sm:border-l border-white/5">
                            <div className="text-left sm:text-right">
                              <div className="text-base lg:text-lg font-black tracking-tighter text-white">₹{item.cost_per_unit}</div>
                              <div className="text-[8px] font-black text-[#555] uppercase tracking-widest">Per {item.unit}</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setSelectedItem(item); setShowRestockModal(true); }}
                                className="p-2.5 rounded-xl bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/10"
                              >
                                <RotateCcw size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/10"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                          <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-gradient-to-r from-[#ff1744] to-[#d4af37]'}`}
                            />
                          </div>
                          <span className="text-[9px] font-black min-w-[70px] text-right text-[#666] uppercase tracking-widest">
                            {item.current_stock} <span className="text-[#333]">/</span> {item.min_stock_threshold} min
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-6">
              {/* AI insights Card */}
              <div className="glass-card rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 border border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/5 to-transparent relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 rounded-full blur-[80px]" />
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center shadow-2xl">
                    <Brain className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg lg:text-xl font-black tracking-tighter">Supply Chain AI</h3>
                    <p className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest">Inventory Nexus</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 min-h-[160px] text-xs lg:text-sm leading-relaxed text-[#ccc] italic max-h-[300px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: isAiLoading ? "Synchronizing inventory matrix..." : (aiInsight ? aiInsight.replace(/\n/g, '<br/>') : "Initiating deep stock analysis...") }}
                  />

                  <button
                    onClick={generateAiInsight}
                    className="w-full py-4 rounded-xl bg-white/[0.05] border border-white/5 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    <Zap size={14} className="text-[#d4af37]" />
                    Recalibrate Forecast
                  </button>
                </div>
              </div>

              {/* Activity Log */}
              <div className="glass-card rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 border border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444] mb-6 flex items-center gap-2">
                  <History size={14} /> Neural Events
                </h3>
                <div className="space-y-6">
                  {[
                    { label: "Stock injection", item: "Premium Wax", delta: "+25.0 Units", time: "2h ago" },
                    { label: "Restock required", item: "Microfiber XL", delta: "Critical Level", time: "5h ago" },
                    { label: "Asset registered", item: "Iron Fallout", delta: "New Designator", time: "1d ago" }
                  ].map((event, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="w-1 h-8 rounded-full bg-white/5 group-hover:bg-[#ff1744] transition-colors shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-tighter truncate">{event.label}: {event.item}</div>
                        <div className="text-[8px] font-black text-[#444] uppercase">{event.delta}</div>
                        <div className="text-[8px] font-black text-[#222] uppercase mt-1">{event.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Provision Modal */}
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md" onClick={() => setShowModal(false)}>
              <div className="absolute inset-0" />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                className="w-full max-w-xl bg-[#0d0d0d] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[3rem] p-6 lg:p-10 relative overflow-hidden max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff1744]/10 rounded-full blur-[100px] -z-1" />

                <div className="flex items-center justify-between mb-8 lg:mb-10">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-black tracking-tighter">Register Asset</h2>
                    <p className="text-[10px] font-black text-[#555] uppercase tracking-widest mt-1">Supply Nexus Integration</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-2 lg:p-3 hover:bg-white/5 rounded-2xl border border-white/5"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Asset Designation</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      placeholder="e.g. ULTRA-SONIC POLISH"
                      className="w-full px-5 py-4 lg:py-5 rounded-2xl bg-white/[0.03] border border-white/10 focus:border-[#ff1744] focus:outline-none transition-all font-bold tracking-tight text-sm lg:text-base"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Category Link</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-5 py-4 lg:py-5 rounded-2xl bg-white/[0.03] border border-white/10 focus:border-[#ff1744] focus:outline-none font-bold uppercase text-[10px] lg:text-xs tracking-widest appearance-none"
                      >
                        <option value="chemicals">Chemicals</option>
                        <option value="cloths">Accessories</option>
                        <option value="tools">Hardware</option>
                        <option value="coatings">Pro-Coatings</option>
                        <option value="other">General</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Metric Unit</label>
                      <select
                        value={form.unit}
                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                        className="w-full px-5 py-4 lg:py-5 rounded-2xl bg-white/[0.03] border border-white/10 focus:border-[#ff1744] focus:outline-none font-bold uppercase text-[10px] lg:text-xs tracking-widest appearance-none"
                      >
                        <option value="liters">Liters</option>
                        <option value="ml">Milliliters</option>
                        <option value="pieces">Units / Pcs</option>
                        <option value="sets">Industrial Sets</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                    <div className="space-y-3 text-center">
                      <label className="text-[8px] font-black text-[#444] uppercase tracking-widest">Initial Stack</label>
                      <input
                        type="number"
                        value={form.current_stock}
                        onChange={(e) => setForm({ ...form, current_stock: parseFloat(e.target.value) })}
                        className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/5 focus:border-[#ff1744] focus:outline-none text-center font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-3 text-center">
                      <label className="text-[8px] font-black text-[#444] uppercase tracking-widest">Min Payload</label>
                      <input
                        type="number"
                        value={form.min_stock_threshold}
                        onChange={(e) => setForm({ ...form, min_stock_threshold: parseFloat(e.target.value) })}
                        className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/5 focus:border-[#ff1744] focus:outline-none text-center font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-3 text-center">
                      <label className="text-[8px] font-black text-[#444] uppercase tracking-widest">Acq. Cost</label>
                      <input
                        type="number"
                        value={form.cost_per_unit}
                        onChange={(e) => setForm({ ...form, cost_per_unit: parseFloat(e.target.value) })}
                        className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/5 focus:border-[#ff1744] focus:outline-none text-center font-bold text-sm text-[#d4af37]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 lg:py-5 rounded-2xl bg-white/5 font-black uppercase text-[10px] tracking-widest">Abort</button>
                    <button type="submit" className="flex-2 py-4 lg:py-5 rounded-2xl btn-premium text-white font-black uppercase text-[10px] tracking-widest">Initialize Asset</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Restock Modal */}
          {showRestockModal && selectedItem && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl" onClick={() => setShowRestockModal(false)}>
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                className="w-full max-w-sm bg-[#0d0d0d] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 lg:p-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                    <RotateCcw size={32} />
                  </div>
                  <h2 className="text-xl lg:text-2xl font-black tracking-tighter">Stack Injection</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#444] mt-1 truncate">{selectedItem.name}</p>
                </div>

                <div className="p-5 lg:p-6 bg-white/[0.02] rounded-2xl lg:rounded-3xl border border-white/5 mb-8 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#333] block mb-2">Current Mass</span>
                  <span className="text-2xl lg:text-3xl font-black tracking-tighter">{selectedItem.current_stock} <span className="text-sm font-bold text-[#444]">{selectedItem.unit}</span></span>
                </div>

                <div className="space-y-4 mb-8">
                  <label className="text-[10px] font-black text-[#444] uppercase tracking-widest block text-center px-1">Load Quantity</label>
                  <input
                    type="number"
                    value={restockQty}
                    onChange={(e) => setRestockQty(parseFloat(e.target.value))}
                    autoFocus
                    className="w-full py-5 lg:py-6 rounded-2xl bg-white/5 border border-white/10 focus:border-green-500 focus:outline-none transition-all text-center text-3xl lg:text-4xl font-black tracking-tighter"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={handleRestock} className="w-full py-4 lg:py-5 rounded-2xl bg-green-500 text-black font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-500/20">Confirm Injection</button>
                  <button onClick={() => setShowRestockModal(false)} className="w-full py-3 lg:py-4 rounded-xl text-[#444] font-black uppercase text-[10px] tracking-widest">Cancel</button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
