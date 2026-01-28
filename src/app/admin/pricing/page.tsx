"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Plus, X, Trash2, Calendar, Clock, Cloud, Power } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import toast from "react-hot-toast";
import type { PricingRule } from "@/lib/types";

export default function PricingRulesPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    rule_type: "weekend" as PricingRule["rule_type"],
    modifier_type: "percentage" as "percentage" | "fixed",
    modifier_value: 10,
    conditions: {} as Record<string, any>,
  });

  useEffect(() => { loadRules(); }, []);

  const loadRules = async () => {
    try {
      const res = await fetch("/api/pricing-rules");
      if (res.ok) setRules(await res.json());
    } finally { setIsLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/pricing-rules", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    if (res.ok) { toast.success("Rule created!"); setShowModal(false); loadRules(); }
  };

  const toggleActive = async (rule: PricingRule) => {
    const res = await fetch(`/api/pricing-rules/${rule.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !rule.active }),
    });
    if (res.ok) { toast.success(rule.active ? "Disabled" : "Enabled"); loadRules(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    const res = await fetch(`/api/pricing-rules/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted!"); loadRules(); }
  };

  const getIcon = (t: string) => t === "weekend" ? Calendar : t === "peak_hour" ? Clock : t === "weather" ? Cloud : TrendingUp;
  const getColor = (t: string) => t === "weekend" ? "from-purple-500 to-pink-500" : t === "peak_hour" ? "from-orange-500 to-red-500" : t === "weather" ? "from-blue-500 to-cyan-500" : "from-green-500 to-emerald-500";

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="py-8 pb-16 max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-3xl font-bold">Dynamic Pricing</h1><p className="text-[#888]">Configure surge & discounts</p></div>
          <button onClick={() => setShowModal(true)} className="btn-premium px-6 py-3 rounded-xl text-white flex items-center gap-2"><Plus size={18} />Add Rule</button>
        </div>

        <div className="glass-card rounded-2xl p-6">
          {isLoading ? <div className="text-center py-12"><div className="w-8 h-8 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto" /></div> : rules.length === 0 ? (
            <div className="text-center py-12 text-[#888]"><TrendingUp size={32} className="mx-auto mb-2 opacity-50" /><p>No rules</p></div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => {
                const Icon = getIcon(rule.rule_type);
                return (
                  <div key={rule.id} className={`flex items-center gap-4 p-4 rounded-xl ${rule.active ? "bg-white/5" : "bg-white/2 opacity-50"}`}>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getColor(rule.rule_type)} flex items-center justify-center`}><Icon size={24} className="text-white" /></div>
                    <div className="flex-1"><h4 className="font-medium">{rule.name}</h4><p className="text-sm text-[#888] capitalize">{rule.rule_type.replace("_", " ")}</p></div>
                    <div className="text-center px-4"><div className={`text-lg font-bold ${rule.modifier_value >= 0 ? "text-red-500" : "text-green-500"}`}>{rule.modifier_value >= 0 ? "+" : ""}{rule.modifier_type === "percentage" ? `${rule.modifier_value}%` : `₹${rule.modifier_value}`}</div></div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleActive(rule)} className={`p-2 rounded-lg ${rule.active ? "bg-green-500/10 text-green-500" : "bg-white/5 text-[#888]"}`}><Power size={16} /></button>
                      <button onClick={() => handleDelete(rule.id)} className="p-2 rounded-lg bg-red-500/10 text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}

