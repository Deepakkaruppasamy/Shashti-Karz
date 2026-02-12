"use client";

import React, { useState, useEffect } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
  Sparkles,
  RefreshCw,
  Layers,
  Calculator,
  Calendar,
  Clock,
  Cloud,
  TrendingUp,
  Plus,
  Target,
  Power,
  Trash2,
  X
} from "lucide-react";

import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { BrandedLoader } from "@/components/animations/BrandedLoader";
import type { PricingRule } from "@/lib/types";

export default function PricingRulesPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testBasePrice, setTestBasePrice] = useState(1000);
  const [testResult, setTestResult] = useState<{
    final_price: number;
    discount: number;
    applied_rules: PricingRule[];
  } | null>(null);

  const [form, setForm] = useState({
    name: "",
    rule_type: "weekend" as PricingRule["rule_type"],
    modifier_type: "percentage" as "percentage" | "fixed",
    modifier_value: 10,
    conditions: {} as Record<string, string | number | boolean>,
  });

  // Real-time subscription
  useRealtimeSubscription({
    table: "pricing_rules",
    onInsert: (newRule) => {
      setRules((prev) => [newRule, ...prev]);
      toast.success("New pricing strategy detected");
    },
    onUpdate: (updatedRule) => {
      setRules((prev) => prev.map((r) => (r.id === updatedRule.id ? updatedRule : r)));
    },
    onDelete: (payload) => {
      setRules((prev) => prev.filter((r) => r.id !== payload.old.id));
    },
  });

  useEffect(() => {
    loadRules();
    generateAiInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRules = async () => {
    try {
      const res = await fetch("/api/pricing-rules");
      if (res.ok) setRules(await res.json());
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
          command: "Analyze our dynamic pricing rules. Suggest a new surge rule for peak seasons or weather-based adjustments.",
          context: { type: "pricing", current_rules: rules }
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

  const runTest = async () => {
    const res = await fetch("/api/pricing-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "calculate",
        base_price: testBasePrice,
        date: new Date().toISOString(),
        time: "11:00",
        weather: "rainy"
      }),
    });
    if (res.ok) {
      setTestResult(await res.json());
      toast.info("Pricing calculation complete");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/pricing-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Dynamic rule deployed!");
      setShowModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setForm({ name: "", rule_type: "weekend", modifier_type: "percentage", modifier_value: 10, conditions: {} });
  };

  const toggleActive = async (rule: PricingRule) => {
    await fetch(`/api/pricing-rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !rule.active }),
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Decommission this rule?")) return;
    await fetch(`/api/pricing-rules/${id}`, { method: "DELETE" });
  };

  const getIcon = (t: string) => {
    switch (t) {
      case "weekend": return Calendar;
      case "peak_hour": return Clock;
      case "weather": return Cloud;
      default: return TrendingUp;
    }
  };

  const getColor = (t: string) => {
    switch (t) {
      case "weekend": return "text-purple-500 bg-purple-500/10";
      case "peak_hour": return "text-orange-500 bg-orange-500/10";
      case "weather": return "text-blue-500 bg-blue-500/10";
      default: return "text-green-500 bg-green-500/10";
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">

      <div className="flex-1 overflow-auto pb-24 lg:pb-8">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tighter flex items-center gap-3">
                <Layers className="text-[#ff1744]" />
                Dynamic Pricing
              </h1>
              <p className="text-[#888] mt-1 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-[#ff1744] animate-pulse" />
                Live Revenue Optimizer
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setTestMode(!testMode)}
                className={`flex-1 md:flex-none px-6 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all ${testMode ? "bg-white text-black" : "bg-white/5 text-[#555] border border-white/5"}`}
              >
                <Calculator size={16} />
                Simulator
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex-1 md:flex-none btn-premium px-6 py-3.5 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#ff1744]/20"
              >
                <Plus size={16} />
                New Rule
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* AI Insight Bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 lg:p-6 glass-card rounded-2xl lg:rounded-[2rem] border border-[#ff1744]/20 bg-gradient-to-br from-[#ff1744]/5 to-transparent relative overflow-hidden flex flex-col sm:flex-row items-center gap-6"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff1744] to-[#a30d29] flex items-center justify-center shrink-0 shadow-lg">
                  <Sparkles className="text-white fill-white" size={24} />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#ff1744]">AI Surge Recommender</h3>
                    <button onClick={generateAiInsights} className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                      <RefreshCw size={12} className={isAiLoading ? "animate-spin" : ""} />
                    </button>
                  </div>
                  <p className="text-xs lg:text-sm text-[#ccc] leading-relaxed italic">
                    {isAiLoading ? "Analyzing market demand patterns..." : (aiInsight || "No insights yet. Engage engine to analyze demand.")}
                  </p>
                </div>
              </motion.div>

              {/* Strategy Feed */}
              <div className="glass-card rounded-2xl lg:rounded-[2.5rem] p-4 lg:p-8 border border-white/5">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">Revenue Algorithms</h3>
                  <span className="px-2 py-0.5 rounded-lg bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest border border-green-500/10">Active Mesh</span>
                </div>

                {isLoading ? (
                  <BrandedLoader className="py-20" />
                ) : (
                  <div className="space-y-3 lg:space-y-4">
                    {rules.map((rule) => {
                      const Icon = getIcon(rule.rule_type);
                      const isSurge = rule.modifier_value > 0;
                      return (
                        <motion.div
                          key={rule.id}
                          layout
                          className={`p-4 lg:p-6 rounded-2xl border-2 transition-all group ${rule.active ? "bg-white/[0.02] border-white/5 hover:border-[#ff1744]/30" : "bg-white/[0.01] border-white/5 opacity-40 grayscale"}`}
                        >
                          <div className="flex items-center gap-4 lg:gap-6">
                            <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl ${getColor(rule.rule_type)} flex items-center justify-center shrink-0`}>
                              <Icon size={22} className="lg:w-6 lg:h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-black tracking-tight truncate pr-4">{rule.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-[#444] whitespace-nowrap">{rule.rule_type.replace("_", " ")}</span>
                                <div className={`w-1 h-1 rounded-full ${isSurge ? "bg-orange-500" : "bg-green-500"}`} />
                                <span className={`text-[8px] lg:text-[10px] font-black uppercase tracking-widest ${isSurge ? "text-orange-500" : "text-green-500"}`}>
                                  {isSurge ? "Surge" : "Efficiency"}
                                </span>
                              </div>
                            </div>
                            <div className="text-right pr-4 lg:pr-8 border-r border-white/5 w-24 lg:w-32">
                              <div className={`text-xl lg:text-3xl font-black tracking-tighter ${isSurge ? "text-[#ff1744]" : "text-green-500"}`}>
                                {isSurge ? "+" : ""}{rule.modifier_type === "percentage" ? `${rule.modifier_value}%` : `₹${rule.modifier_value}`}
                              </div>
                              <div className="text-[8px] font-black text-[#333] uppercase">Shift</div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button onClick={() => toggleActive(rule)} className={`p-2.5 rounded-xl border transition-all ${rule.active ? "bg-green-500/10 text-green-500 border-green-500/10" : "bg-black/20 text-[#333] border-white/5"}`}><Power size={18} /></button>
                              <button onClick={() => handleDelete(rule.id)} className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/10"><Trash2 size={18} /></button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Simulator Overlay/Card */}
              <AnimatePresence>
                {testMode && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card rounded-[2rem] p-6 lg:p-8 border border-blue-500/20 bg-blue-500/5 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px]" />
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg font-black tracking-tighter flex items-center gap-2">
                        <Calculator size={20} className="text-blue-500" />
                        Revenue Sim
                      </h3>
                      <button onClick={() => setTestMode(false)} className="lg:hidden p-2 hover:bg-black/20 rounded-lg"><X size={18} /></button>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-[#555] uppercase tracking-widest ml-1">Base Vector (₹)</label>
                        <input type="number" value={testBasePrice} onChange={(e) => setTestBasePrice(parseInt(e.target.value))} className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none font-black text-xl tracking-tighter" />
                      </div>
                      <button onClick={runTest} className="w-full py-4 rounded-xl bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]">Process Matrix</button>

                      {testResult && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                          <div className="flex justify-between items-end">
                            <span className="text-[8px] font-black text-[#444] uppercase">Net Output</span>
                            <span className="text-2xl font-black tracking-tighter text-white">₹{testResult.final_price}</span>
                          </div>
                          <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                            <span className="text-[8px] font-black text-[#444] uppercase">Delta</span>
                            <span className={`text-[10px] font-black ${testResult.discount < 0 ? "text-red-400" : "text-green-400"}`}>
                              ₹{Math.abs(testResult.discount)} {testResult.discount < 0 ? "Surge" : "Saving"}
                            </span>
                          </div>
                          {testResult.applied_rules.length > 0 && (
                            <div className="pt-2 border-t border-white/5">
                              <p className="text-[8px] font-black text-[#222] uppercase mb-2">Applied Logic:</p>
                              <div className="space-y-2">
                                {testResult.applied_rules.map((r: { id: string; name: string; modifier_value: number }) => (
                                  <div key={r.id} className="text-[9px] flex justify-between items-center">
                                    <span className="text-[#666] font-bold truncate pr-4">{r.name}</span>
                                    <span className="font-black text-white shrink-0">{r.modifier_value > 0 ? "+" : ""}{r.modifier_value}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status Pool */}
              <div className="glass-card rounded-[2rem] p-6 lg:p-8 border border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#333] mb-6 flex items-center gap-2"><Target size={14} /> Algorithm Health</h3>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="text-2xl font-black text-white">{rules.filter(r => r.active).length}</div>
                    <div className="text-[8px] text-[#444] font-black uppercase tracking-widest mt-1">Live Agents</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="text-2xl font-black text-[#ff1744]">{rules.filter(r => Math.abs(r.modifier_value) > 20).length}</div>
                    <div className="text-[8px] text-[#444] font-black uppercase tracking-widest mt-1">Critical Surge</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Provisioning Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md" onClick={() => setShowModal(false)}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-lg bg-[#0d0d0d] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[3rem] p-8 lg:p-10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-[#ff1744] flex items-center justify-center"><Plus size={24} /></div>
                <div>
                  <h2 className="text-2xl font-black tracking-tighter">Algorithm Entry</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#444] mt-1">New Pricing Logic</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[#555] uppercase tracking-widest ml-1">Concept Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] outline-none font-bold text-sm" placeholder="e.g. MONSOON SURGE X" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#555] uppercase tracking-widest ml-1">Trigger Signal</label>
                    <div className="relative">
                      <select value={form.rule_type} onChange={(e) => setForm({ ...form, rule_type: e.target.value as PricingRule["rule_type"] })} className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 outline-none font-black uppercase text-[10px] tracking-widest appearance-none transition-colors focus:border-[#ff1744]">
                        <option value="weekend">Weekend</option>
                        <option value="peak_hour">Peak Hour</option>
                        <option value="high_demand">Demand</option>
                        <option value="weather">Weather</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#555] uppercase tracking-widest ml-1">Vector Bias (%)</label>
                    <input type="number" value={form.modifier_value} onChange={(e) => setForm({ ...form, modifier_value: parseInt(e.target.value) })} className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] outline-none font-black text-sm text-center" />
                  </div>
                </div>

                <div className="flex gap-4 pt-8">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest text-[#444]">Abort</button>
                  <button type="submit" className="flex-[2] py-4 btn-premium rounded-2xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl">Engage Algorithm</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
