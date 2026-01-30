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
  Radio
} from "lucide-react";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/AdminSidebar";
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

  const [sendResult, setSendResult] = useState<{
    success?: boolean;
    sentCount?: number;
    emailsSent?: number;
    totalUsers?: number;
    errors?: string[];
  } | null>(null);

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

  // Real-time subscription
  useRealtimeSubscription<BroadcastHistory>({
    table: "broadcast_history",
    onInsert: (newItem) => {
      setBroadcastHistory(prev => [newItem, ...prev]);
      toast.success(`Broadcase Sent: ${newItem.title}`);
    }
  });

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
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
          context: {
            type: "marketing_copy",
            target_audience: broadcastForm.targetAudience,
            channels: broadcastForm.channels
          }
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Parse response if possible or just use it. AI usually returns text.
        // We'll assume typical format or just raw text.
        // Let's split a simple response if it contains a title and body, otherwise just put it in message.
        // For robustness, we'll put the whole text in message and a generic title, or try to parse.
        // Simplest for now: 
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
    if (!broadcastForm.title || !broadcastForm.message) {
      toast.error("Please fill in title and message");
      return;
    }

    if (broadcastForm.channels.length === 0) {
      toast.error("Please select at least one channel");
      return;
    }

    setIsLoading(true);
    setSendResult(null);

    try {
      const res = await fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(broadcastForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send broadcast");
      }

      setSendResult(data);
      toast.success(`Broadcast sent! ${data.sentCount} in-app, ${data.emailsSent} emails`);
      setBroadcastForm({
        title: "",
        message: "",
        channels: ["in_app"],
        priority: "medium",
        targetAudience: "all",
        offerCode: "",
        discount: "",
      });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRule = (ruleId: string) => {
    setRules(prev =>
      prev.map(r => r.id === ruleId ? { ...r, active: !r.active } : r)
    );
    toast.success("Rule updated");
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
                <Radio className="text-[#ff1744]" />
                Command Center
              </h1>
              <p className="text-[#888] mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Broadcast Systems
              </p>
            </div>
          </div>

          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: "send", label: "Send Broadcast", icon: Send },
              { id: "history", label: "History", icon: Clock },
              { id: "rules", label: "Auto Rules", icon: Settings },
              { id: "templates", label: "Templates", icon: Edit },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                  ? "bg-[#ff1744] text-white shadow-lg shadow-[#ff1744]/20"
                  : "bg-white/5 text-[#888] hover:bg-white/10 hover:text-white"
                  }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {activeTab === "send" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-2 gap-6">
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="text-xl font-semibold mb-6">Create Broadcast</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#888] uppercase tracking-widest mb-2">Notification Title</label>
                      <input
                        type="text"
                        value={broadcastForm.title}
                        onChange={(e) => setBroadcastForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Exclusive Weekend Offer!"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#666] focus:outline-none focus:border-[#ff1744] transition-colors"
                      />
                    </div>

                    <div className="relative">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-[#888] uppercase tracking-widest">Message Content</label>
                        <button
                          onClick={generateAiMessage}
                          disabled={aiGenerating}
                          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#d4af37] hover:text-white transition-colors"
                        >
                          {aiGenerating ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          AI Generate
                        </button>
                      </div>
                      <textarea
                        value={broadcastForm.message}
                        onChange={(e) => setBroadcastForm(f => ({ ...f, message: e.target.value }))}
                        placeholder="Describe your offer or update..."
                        rows={4}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#666] focus:outline-none focus:border-[#ff1744] transition-colors resize-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#888] uppercase tracking-widest mb-2">Delivery Channels</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "in_app", label: "In-App", icon: Bell },
                          { id: "email", label: "Email", icon: Mail },
                          { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
                        ].map((channel) => (
                          <button
                            key={channel.id}
                            onClick={() => {
                              setBroadcastForm(f => ({
                                ...f,
                                channels: f.channels.includes(channel.id)
                                  ? f.channels.filter(c => c !== channel.id)
                                  : [...f.channels, channel.id]
                              }));
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${broadcastForm.channels.includes(channel.id)
                              ? "bg-[#ff1744] text-white shadow-lg shadow-[#ff1744]/20"
                              : "bg-white/5 text-[#888] hover:bg-white/10"
                              }`}
                          >
                            <channel.icon size={16} />
                            {channel.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#888] uppercase tracking-widest mb-2">Target Audience</label>
                        <select
                          value={broadcastForm.targetAudience}
                          onChange={(e) => setBroadcastForm(f => ({ ...f, targetAudience: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff1744] transition-colors"
                        >
                          <option value="all">All Customers</option>
                          <option value="active">Active Customers</option>
                          <option value="new">New Signups</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#888] uppercase tracking-widest mb-2">Priority</label>
                        <select
                          value={broadcastForm.priority}
                          onChange={(e) => setBroadcastForm(f => ({ ...f, priority: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff1744] transition-colors"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleSendBroadcast}
                      disabled={isLoading}
                      className="w-full btn-premium py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 mt-4 shadow-lg shadow-[#ff1744]/20"
                    >
                      {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <><Send size={20} /> Send Broadcast</>}
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass-card rounded-2xl p-6 border border-white/10">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <Eye size={20} className="text-[#d4af37]" />
                      Live Preview
                    </h2>
                    <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-white/5">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center flex-shrink-0">
                          <Bell size={24} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold truncate">{broadcastForm.title || "Notification Title"}</h4>
                            <span className="text-[10px] text-[#666] whitespace-nowrap ml-2">Just now</span>
                          </div>
                          <p className="text-sm text-[#888] leading-relaxed">
                            {broadcastForm.message || "Your broadcast message will appear here for customers..."}
                          </p>
                          {(broadcastForm.offerCode || broadcastForm.discount) && (
                            <div className="mt-3 flex items-center gap-2">
                              {broadcastForm.discount && <span className="px-2 py-1 bg-[#d4af37]/20 text-[#d4af37] rounded text-xs font-bold">{broadcastForm.discount}</span>}
                              {broadcastForm.offerCode && <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono text-[#aaa]">Code: {broadcastForm.offerCode}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-[#888] uppercase tracking-widest mb-4">AI Campaign Insights</h3>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-3 text-purple-400 mb-2 text-sm font-bold">
                          <Sparkles size={16} /> Best Delivery Time
                        </div>
                        <p className="text-xs text-[#888]">AI suggests sending this between 10 AM - 12 PM for 24% higher open rate.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-3 text-blue-400 mb-2 text-sm font-bold">
                          <BarChart3 size={16} /> Estimated Reach
                        </div>
                        <p className="text-xs text-[#888]">Approximately 1,240 customers across all selected channels.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden border border-white/5">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white/5 text-left">
                        <th className="px-6 py-4 text-xs font-bold text-[#888] uppercase tracking-widest">Broadcast</th>
                        <th className="px-6 py-4 text-xs font-bold text-[#888] uppercase tracking-widest">Target</th>
                        <th className="px-6 py-4 text-xs font-bold text-[#888] uppercase tracking-widest text-center">Reach</th>
                        <th className="px-6 py-4 text-xs font-bold text-[#888] uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-[#888] uppercase tracking-widest">Sent At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {broadcastHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm">{item.title}</p>
                            <p className="text-xs text-[#666] line-clamp-1">{item.message}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {item.channels?.map(ch => <span key={ch} className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-[#aaa]">{ch}</span>)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="font-bold text-sm">{item.sent_count + item.emails_sent}</p>
                            <p className="text-[10px] text-[#666]">users</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-[10px] font-bold uppercase tracking-wider">Successful</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#888]">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {broadcastHistory.length === 0 && !historyLoading && (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-[#666]">No history found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === "rules" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="glass-card rounded-2xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${rule.active ? "bg-green-500/20 text-green-500" : "bg-white/5 text-[#666]"}`}>
                        {rule.event_type.includes("booking") ? <Calendar size={24} /> : rule.event_type.includes("payment") ? <CreditCard size={24} /> : <Wrench size={24} />}
                      </div>
                      <div>
                        <h3 className="font-bold">{rule.name}</h3>
                        <p className="text-xs text-[#888]">Event: {rule.event_type.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden md:flex gap-2">
                        {rule.actions.channels.map(ch => <span key={ch} className="px-2 py-1 bg-white/5 rounded text-[10px] text-[#aaa]">{ch}</span>)}
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={rule.active} onChange={() => toggleRule(rule.id)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#ff1744] after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-lg" />
                      </label>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Sent", value: analytics.total_sent, icon: Send, color: "text-blue-500" },
                    { label: "Open Rate", value: `${analytics.open_rate}%`, icon: Eye, color: "text-green-500" },
                    { label: "Click Rate", value: `${analytics.click_rate}%`, icon: TrendingUp, color: "text-[#d4af37]" },
                    { label: "Fatigue Risk", value: "Low", icon: AlertCircle, color: "text-emerald-500" },
                  ].map((stat, i) => (
                    <div key={i} className="glass-card rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-3 text-[#888] text-xs font-bold uppercase tracking-widest">
                        <stat.icon size={14} className={stat.color} /> {stat.label}
                      </div>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-semibold mb-6">Channel Performance Comparison</h3>
                  <div className="space-y-6">
                    {Object.entries(analytics.channel_performance).map(([channel, stats]) => (
                      <div key={channel} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-sm font-bold uppercase tracking-wider">{channel.replace("_", "-")}</span>
                          <span className="text-xs text-[#888]">{stats.opened} / {stats.sent} opened</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(stats.opened / stats.sent) * 100}%` }}
                            className="h-full bg-gradient-to-r from-[#ff1744] to-[#d4af37]"
                          />
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
