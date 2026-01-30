"use client";

import React, { useState, useEffect } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
  Sparkles,
  RefreshCw,
  Layers,
  Zap,
  Calculator,
  AlertTriangle,
  Calendar,
  Clock,
  Cloud,
  TrendingUp,
  Plus,
  Power,
  Trash2
} from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { PricingRule } from "@/lib/types";

export default function PricingRulesPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testBasePrice, setTestBasePrice] = useState(1000);
  const [testResult, setTestResult] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    rule_type: "weekend" as PricingRule["rule_type"],
    modifier_type: "percentage" as "percentage" | "fixed",
    modifier_value: 10,
    conditions: {} as Record<string, any>,
  });

  // Real-time subscription
  useRealtimeSubscription({
    table: "pricing_rules",
    onInsert: (newRule) => {
      setRules((prev) => [newRule, ...prev]);
      toast.success("New pricing rule detected!");
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
    } catch (e) {
      console.error(e);
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
      toast.success("Rule created!");
      setShowModal(false);
      setForm({
        name: "",
        rule_type: "weekend",
        modifier_type: "percentage",
        modifier_value: 10,
        conditions: {},
      });
    }
  };

  const toggleActive = async (rule: PricingRule) => {
    await fetch(`/api/pricing-rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !rule.active }),
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
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
      case "weekend": return "from-purple-500 to-pink-500";
      case "peak_hour": return "from-orange-500 to-red-500";
      case "weather": return "from-blue-500 to-cyan-500";
      default: return "from-green-500 to-emerald-500";
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                <Layers className="text-[#ff1744]" />
                Dynamic Pricing
              </h1>
              <p className="text-[#888] mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff1744] animate-pulse" />
                Live Revenue Optimizer Active
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setTestMode(!testMode)}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${testMode ? "bg-white/10 text-white" : "bg-white/5 text-[#888] hover:bg-white/10"
                  }`}
              >
                <Calculator size={18} />
                Simulator
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="btn-premium px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2 shadow-lg shadow-[#ff1744]/20"
              >
                <Plus size={18} />
                New Rule
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* AI Insight */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-[2rem] p-6 border border-[#ff1744]/20 bg-gradient-to-br from-[#ff1744]/5 to-transparent relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff1744]/10 rounded-full blur-3xl" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#ff1744] rounded-lg">
                    <Zap size={18} className="text-white fill-white" />
                  </div>
                  <h3 className="font-bold">AI Surge Recommender</h3>
                  <button onClick={generateAiInsights} className="ml-auto text-[#888] hover:text-white">
                    <RefreshCw size={16} className={isAiLoading ? "animate-spin" : ""} />
                  </button>
                </div>
                <p className="text-sm text-[#ccc] leading-relaxed italic">
                  {isAiLoading ? "Analyzing market demand patterns..." : aiInsight || "Refresh to generate pricing insights."}
                </p>
              </motion.div>

              {/* Rules List */}
              <div className="glass-card rounded-[2rem] p-8 border border-white/5">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  Active Strategy
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20">Synced</span>
                </h3>
                {isLoading ? (
                  <div className="text-center py-20 animate-pulse">
                    <Layers size={48} className="mx-auto mb-4 text-[#222]" />
                    <p className="text-[#888]">Loading master rules...</p>
                  </div>
                ) : rules.length === 0 ? (
                  <div className="text-center py-20 text-[#888]">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <Zap size={32} className="opacity-20" />
                    </div>
                    <p>No pricing rules configured.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rules.map((rule) => {
                      const Icon = getIcon(rule.rule_type);
                      const isSurge = rule.modifier_value > 0;
                      return (
                        <motion.div
                          key={rule.id}
                          layout
                          className={`group flex items-center gap-6 p-6 rounded-2xl border transition-all duration-300 ${rule.active
                            ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                            : "bg-white/[0.01] border-white/5 opacity-50 grayscale"
                            }`}
                        >
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getColor(rule.rule_type)} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                            <Icon size={24} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold group-hover:text-[#ff1744] transition-colors">{rule.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#888]">{rule.rule_type.replace("_", " ")}</span>
                              <span className="w-1 h-1 rounded-full bg-white/20" />
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isSurge ? "text-orange-500" : "text-green-500"}`}>
                                {isSurge ? "Surge Pricing" : "Discount Rule"}
                              </span>
                            </div>
                          </div>
                          <div className="text-right px-6 border-x border-white/5">
                            <div className={`text-2xl font-black tracking-tighter ${isSurge ? "text-[#ff1744]" : "text-green-500"}`}>
                              {isSurge ? "+" : ""}{rule.modifier_type === "percentage" ? `${rule.modifier_value}%` : `₹${rule.modifier_value}`}
                            </div>
                            <div className="text-[10px] font-bold text-[#666] uppercase">Adjustment</div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleActive(rule)}
                              className={`p-3 rounded-xl transition-all ${rule.active ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-white/5 text-[#888] border border-white/10"}`}
                            >
                              <Power size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(rule.id)}
                              className="p-3 rounded-xl bg-red-500/5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Simulator Card */}
              <AnimatePresence>
                {testMode && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="glass-card rounded-[2rem] p-6 border border-blue-500/20 bg-blue-500/5"
                  >
                    <h3 className="font-bold flex items-center gap-2 mb-6">
                      <Calculator size={20} className="text-blue-500" />
                      Revenue Simulator
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em] ml-1">Base Price (₹)</label>
                        <input
                          type="number"
                          value={testBasePrice}
                          onChange={(e) => setTestBasePrice(parseInt(e.target.value))}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none transition-all font-bold"
                        />
                      </div>
                      <button
                        onClick={runTest}
                        className="w-full py-4 rounded-xl bg-blue-500 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all"
                      >
                        Calculate Final Price
                      </button>

                      {testResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2"
                        >
                          <div className="flex justify-between items-center text-sm font-bold">
                            <span className="text-[#888]">Final Price:</span>
                            <span className="text-xl text-white">₹{testResult.final_price}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[#888]">Total Adjustment:</span>
                            <span className={testResult.discount < 0 ? "text-red-400" : "text-green-400"}>
                              ₹{Math.abs(testResult.discount)} {testResult.discount < 0 ? "Surge" : "Saving"}
                            </span>
                          </div>
                          {testResult.applied_rules.length > 0 && (
                            <div className="pt-2 border-t border-white/5">
                              <p className="text-[10px] text-[#666] uppercase mb-1">Applied Rules:</p>
                              {testResult.applied_rules.map((r: any) => (
                                <div key={r.id} className="text-[10px] flex justify-between">
                                  <span>{r.name}</span>
                                  <span className="font-bold">{r.modifier_value > 0 ? "+" : ""}{r.modifier_value}%</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Stats */}
              <div className="glass-card rounded-[2rem] p-6 border border-white/5">
                <h3 className="text-sm font-bold mb-4 uppercase tracking-[0.2em] text-[#888]">Live Stats</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-black">{rules.filter(r => r.active).length}</div>
                      <div className="text-[10px] text-[#888] font-bold uppercase">Active Rules</div>
                    </div>
                    <Layers className="text-[#888]" size={20} />
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-black text-[#ff1744]">{rules.filter(r => r.modifier_value > 15).length}</div>
                      <div className="text-[10px] text-[#888] font-bold uppercase">High Surge Rules</div>
                    </div>
                    <AlertTriangle className="text-[#ff1744]" size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal remains largely same but updated styling */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-[2.5rem] p-8 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-black mb-6">Create Adjustment Rule</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em] ml-1">Rule Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none" placeholder="e.g. Monsoon Special Surge" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em] ml-1">Trigger</label>
                    <select value={form.rule_type} onChange={(e) => setForm({ ...form, rule_type: e.target.value as any })} className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10">
                      <option value="weekend">Weekend</option>
                      <option value="peak_hour">Peak Hour</option>
                      <option value="high_demand">High Demand</option>
                      <option value="weather">Weather</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em] ml-1">Value (%)</label>
                    <input type="number" value={form.modifier_value} onChange={(e) => setForm({ ...form, modifier_value: parseInt(e.target.value) })} className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10" />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-white/5 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="flex-2 py-4 btn-premium rounded-xl font-bold shadow-lg shadow-[#ff1744]/20">Deploy Rule</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

