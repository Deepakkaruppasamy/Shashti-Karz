"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Bell,
  Send,
  Users,
  Settings,
  BarChart3,
  Plus,
  Trash2,
  Edit,
  Eye,
  Calendar,
  CreditCard,
  Wrench,
  Sparkles,
  MessageCircle,
  Mail,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  X,
  Zap,
  Target,
  Radio,
  ChevronRight,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { BrandedLoader } from "@/components/animations/BrandedLoader";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

type TabType = "send" | "history" | "rules" | "templates" | "analytics";

interface BroadcastHistory {
  id: string;
  title: string;
  message: string;
  channels: string[];
  priority: string;
  target_audience: string;
  offer_code: string | null;
  discount: string | null;
  sent_count: number;
  emails_sent: number;
  total_users: number;
  status: string;
  created_at: string;
}

interface NotificationRule {
  id: string;
  name: string;
  event_type: string;
  conditions: Record<string, any>;
  actions: {
    channels: string[];
    priority: string;
  };
  active: boolean;
}

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("send");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [rules, setRules] = useState<NotificationRule[]>([
    {
      id: "1",
      name: "High-Value Booking Alert",
      event_type: "booking_created",
      conditions: { min_value: 15000 },
      actions: { channels: ["in_app", "whatsapp"], priority: "critical" },
      active: true,
    },
    {
      id: "2",
      name: "Payment Failure Alert",
      event_type: "payment_failed",
      conditions: {},
      actions: { channels: ["in_app", "email", "whatsapp"], priority: "critical" },
      active: true,
    },
    {
      id: "3",
      name: "Service Completion",
      event_type: "service_completed",
      conditions: {},
      actions: { channels: ["in_app", "email"], priority: "high" },
      active: true,
    },
  ]);

  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    message: "",
    channels: ["in_app"] as string[],
    priority: "medium",
    targetAudience: "all",
    offerCode: "",
    discount: "",
  });

  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const [analytics] = useState({
    total_sent: 1247,
    delivery_rate: 98.5,
    open_rate: 72.3,
    click_rate: 34.8,
    channel_performance: {
      in_app: { sent: 1247, delivered: 1247, opened: 901 },
      email: { sent: 856, delivered: 843, opened: 412 },
      whatsapp: { sent: 234, delivered: 231, opened: 198 },
    },
  });

  useRealtimeSubscription<BroadcastHistory>({
    table: "broadcast_history",
    onInsert: (newItem) => {
      setBroadcastHistory(prev => [newItem, ...prev]);
      toast.success(`Broadcast Sent: ${newItem.title}`);
    }
  });

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/notifications/broadcast");
      const data = await res.json();
      setBroadcastHistory(data.history || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const generateAiMessage = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/admin-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "Generate a catchy, high-conversion notification message for a car detailing offer. Assume a 20% discount on Ceramic Coating this weekend.",
          context: { type: "marketing_copy", target_audience: broadcastForm.targetAudience, channels: broadcastForm.channels }
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBroadcastForm(prev => ({
          ...prev,
          title: "Weekend Special: 20% Off Ceramic Coating!",
          message: data.response.replace(/"/g, '')
        }));
        toast.success("AI Content Generated");
      }
    } catch (e) {
      toast.error("AI Generation Failed");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.message) return toast.error("Title and message required");
    if (broadcastForm.channels.length === 0) return toast.error("Select at least one channel");

    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(broadcastForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      toast.success(`Broadcast deployed to ${data.sentCount} nodes`);
      setBroadcastForm({ title: "", message: "", channels: ["in_app"], priority: "medium", targetAudience: "all", offerCode: "", discount: "" });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, active: !r.active } : r));
    toast.success("Rule matrix updated");
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      <div className="flex-1 overflow-auto pb-24 lg:pb-8">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tighter flex items-center gap-3">
                <Radio className="text-[#ff1744]" />
                Command Center
              </h1>
              <p className="text-[#888] mt-1 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Broadcast Systems
              </p>
            </div>
            <div className="hidden lg:flex p-1 glass-card rounded-2xl border border-white/5 bg-white/5">
              {(["send", "history", "rules", "templates", "analytics"] as const).map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? "bg-white text-[#0a0a0a] shadow-lg" : "text-[#555] hover:text-white"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex lg:hidden gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {(["send", "history", "rules", "templates", "analytics"] as const).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === t ? "bg-[#ff1744] text-white shadow-lg" : "bg-white/5 text-[#555]"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-8">
            {activeTab === "send" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-2 gap-8">
                <div className="glass-card rounded-[2.5rem] p-6 lg:p-10 border border-white/5 space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black tracking-tighter">Draft Broadcast</h2>
                    <button onClick={generateAiMessage} disabled={aiGenerating} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#d4af37] border border-[#d4af37]/20 px-4 py-2 rounded-xl bg-[#d4af37]/5 hover:bg-[#d4af37]/10 transition-all">
                      {aiGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      AI Suggestion
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Title Vector</label>
                      <input value={broadcastForm.title} onChange={(e) => setBroadcastForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] font-bold" placeholder="e.g. Exclusive Weekend Blast" />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Payload Content</label>
                      <textarea value={broadcastForm.message} onChange={(e) => setBroadcastForm(f => ({ ...f, message: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] h-32 font-medium" placeholder="Describe the deployment..." />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Active Channels</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "in_app", label: "In-App", icon: Bell },
                          { id: "email", label: "Email", icon: Mail },
                          { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
                        ].map((ch) => (
                          <button key={ch.id} onClick={() => setBroadcastForm(f => ({ ...f, channels: f.channels.includes(ch.id) ? f.channels.filter(c => c !== ch.id) : [...f.channels, ch.id] }))} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${broadcastForm.channels.includes(ch.id) ? "bg-[#ff1744] text-white border-transparent" : "bg-white/5 text-[#555] border-white/5"}`}>
                            <ch.icon size={14} /> {ch.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Cohort Target</label>
                        <select value={broadcastForm.targetAudience} onChange={(e) => setBroadcastForm(f => ({ ...f, targetAudience: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] font-black uppercase text-[10px] tracking-widest appearance-none">
                          <option value="all">Global Population</option>
                          <option value="active">Active Nodes</option>
                          <option value="new">Recent Captures</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-[#444] uppercase tracking-widest ml-1">Urgency</label>
                        <select value={broadcastForm.priority} onChange={(e) => setBroadcastForm(f => ({ ...f, priority: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-[#ff1744] font-black uppercase text-[10px] tracking-widest appearance-none">
                          <option value="low">Low Signal</option>
                          <option value="medium">Standard</option>
                          <option value="high">High Pulse</option>
                          <option value="critical">Critical Path</option>
                        </select>
                      </div>
                    </div>

                    <button onClick={handleSendBroadcast} disabled={isLoading} className="w-full btn-premium py-5 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#ff1744]/20 transition-all hover:scale-[1.02] disabled:opacity-50">
                      {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <><Send size={18} /> Initiate Broadcast</>}
                    </button>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="glass-card rounded-[2.5rem] p-6 lg:p-10 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff1744]/5 rounded-full blur-3xl" />
                    <h3 className="text-[10px] font-black text-[#555] uppercase tracking-[0.3em] mb-8">Node Preview</h3>
                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 relative z-10">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff1744] to-[#fb8c00] flex items-center justify-center shrink-0">
                          <Bell size={24} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black truncate mb-1">{broadcastForm.title || "Payload Identifier"}</h4>
                          <p className="text-xs text-[#666] leading-relaxed mb-4">{broadcastForm.message || "Enter tactical communication context..."}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-[#444] uppercase tracking-widest">Priority: {broadcastForm.priority}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card rounded-[2.5rem] p-6 lg:p-10 border border-white/5 space-y-6">
                    <h3 className="text-[10px] font-black text-[#555] uppercase tracking-[0.3em]">Synapse Insights</h3>
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex items-center gap-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><RefreshCw size={14} /></div>
                        <div className="text-[10px] font-black text-[#888] uppercase tracking-widest leading-relaxed">AI suggests optimal propagation between 10:00 - 12:00 for max resonance.</div>
                      </div>
                      <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Users size={14} /></div>
                        <div className="text-[10px] font-black text-[#888] uppercase tracking-widest">Estimated reach across sectors: 1,247 nodes.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl lg:rounded-[2.5rem] p-4 lg:p-8 border border-white/5">
                <div className="grid md:grid-cols-2 gap-6">
                  {broadcastHistory.map((item) => (
                    <div key={item.id} className="rounded-3xl bg-white/[0.02] border border-white/5 p-6 hover:border-[#ff1744]/30 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="min-w-0">
                          <h4 className="font-black tracking-tighter truncate mb-1">{item.title}</h4>
                          <div className="flex flex-wrap gap-1">
                            {item.channels?.map(ch => <span key={ch} className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black uppercase text-[#444]">{ch}</span>)}
                          </div>
                        </div>
                        <CheckCircle size={16} className="text-green-500" />
                      </div>
                      <p className="text-xs text-[#666] line-clamp-2 mb-6 leading-relaxed">{item.message}</p>
                      <div className="pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-[#333]">Reached {item.sent_count + item.emails_sent} units</span>
                        <span className="text-[#333]">{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {historyLoading ? (
                    <BrandedLoader className="py-20" />
                  ) : broadcastHistory.length === 0 && !historyLoading && (
                    <div className="col-span-full py-20 text-center text-[#222] font-black uppercase tracking-[0.5em]">No Logs Detected</div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "rules" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 gap-6">
                {rules.map((rule) => (
                  <div key={rule.id} className="rounded-3xl bg-white/[0.02] border border-white/5 p-6 flex items-center justify-between group hover:border-white/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${rule.active ? "bg-[#ff1744] text-white" : "bg-white/5 text-[#222]"}`}>
                        {rule.event_type.includes("booking") ? <Calendar size={20} /> : rule.event_type.includes("payment") ? <CreditCard size={20} /> : <Wrench size={20} />}
                      </div>
                      <div>
                        <h3 className="font-black tracking-tighter">{rule.name}</h3>
                        <p className="text-[10px] font-black text-[#444] uppercase tracking-widest mt-1">Event: {rule.event_type.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={rule.active} onChange={() => toggleRule(rule.id)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-white/5 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#ff1744] after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-lg" />
                    </label>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Propagations", value: analytics.total_sent, icon: Send, color: "text-blue-500" },
                    { label: "Resonance", value: `${analytics.open_rate}%`, icon: Eye, color: "text-green-500" },
                    { label: "Capture Rate", value: `${analytics.click_rate}%`, icon: TrendingUp, color: "text-[#d4af37]" },
                    { label: "Signal Health", value: "Optimal", icon: Activity, color: "text-[#ff1744]" },
                  ].map((stat, i) => (
                    <div key={i} className="glass-card rounded-2xl p-6 border border-white/5">
                      <div className="text-[8px] font-black text-[#444] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <stat.icon size={10} className={stat.color} /> {stat.label}
                      </div>
                      <div className="text-xl lg:text-2xl font-black tracking-tighter">{stat.value}</div>
                    </div>
                  ))}
                </div>

                <div className="glass-card rounded-[2.5rem] p-6 lg:p-10 border border-white/5">
                  <h3 className="text-[10px] font-black text-[#555] uppercase tracking-[0.3em] mb-10">Sector Resonance</h3>
                  <div className="space-y-8">
                    {Object.entries(analytics.channel_performance).map(([channel, stats]) => (
                      <div key={channel} className="space-y-3">
                        <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                          <span className="text-[#888]">{channel.replace("_", " ")}</span>
                          <span className="text-white">{stats.opened} / {stats.sent} Resonance points</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.opened / stats.sent) * 100}%` }} className="h-full bg-gradient-to-r from-[#ff1744] to-[#fb8c00]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
