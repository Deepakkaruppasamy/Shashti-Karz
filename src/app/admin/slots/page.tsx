"use client";

import React, { useState, useEffect } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
  Sparkles, Brain, Zap, Info, ShieldAlert, CheckCircle, Smartphone,
  Calendar, ChevronLeft, ChevronRight, RefreshCw, Plus
} from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { AvailabilitySlot } from "@/lib/types";

export default function SlotsPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });

  const [generateForm, setGenerateForm] = useState({
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    slots_per_day: 8,
    max_capacity: 2,
  });

  // Real-time subscription
  useRealtimeSubscription<AvailabilitySlot>({
    table: "availability_slots",
    onUpdate: (updatedSlot) => {
      setSlots((prev) => prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)));
    },
    onInsert: (newSlot) => {
      // Small optimization: only add if within current week range
      setSlots((prev) => [...prev, newSlot]);
    },
    onDelete: (payload) => {
      setSlots((prev) => prev.filter((s) => s.id !== payload.old.id));
    },
  });

  useEffect(() => {
    loadSlots();
    generateAiInsights();
  }, [currentWeekStart]);

  const loadSlots = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date(currentWeekStart);
      endDate.setDate(endDate.getDate() + 6);
      const res = await fetch(
        `/api/slots?start_date=${currentWeekStart.toISOString().split("T")[0]}&end_date=${endDate.toISOString().split("T")[0]}`
      );
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
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
          command: "Analyze our booking slots for the current week. Suggest which slots should be 'Prime Slots' (higher capacity) and which should be blocked for maintenance.",
          context: { type: "scheduling", week_slots: slots.slice(0, 50) }
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

  const generateSlots = async () => {
    const res = await fetch("/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generate: true, ...generateForm }),
    });
    if (res.ok) {
      toast.success("Master schedule generated!");
      setShowGenerateModal(false);
    } else {
      toast.error("Failed to generate slots");
    }
  };

  const toggleBlock = async (slot: AvailabilitySlot) => {
    await fetch(`/api/slots/${slot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_blocked: !slot.is_blocked, reason: slot.is_blocked ? null : "Admin override" }),
    });
  };

  const updateCapacity = async (slot: AvailabilitySlot, delta: number) => {
    const newCapacity = Math.max(1, slot.max_capacity + delta);
    await fetch(`/api/slots/${slot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ max_capacity: newCapacity }),
    });
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentWeekStart(newDate);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

  const getSlotForDateTime = (date: Date, time: string) => {
    const dateStr = date.toISOString().split("T")[0];
    return slots.find((s) => s.date === dateStr && s.start_time === time);
  };

  const totalSlots = slots.length;
  const blockedSlots = slots.filter((s) => s.is_blocked).length;
  const utilization = slots.length > 0
    ? (slots.reduce((sum, s) => sum + s.current_occupancy, 0) / slots.reduce((sum, s) => sum + s.max_capacity, 0) * 100).toFixed(0)
    : "0";

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                <Calendar className="text-[#ff1744]" />
                Slot Master
              </h1>
              <p className="text-[#888] mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Capacity Management Live
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowGenerateModal(true)}
                className="btn-premium px-8 py-3 rounded-2xl text-white font-black flex items-center gap-2 shadow-xl shadow-[#ff1744]/10"
              >
                <Plus size={18} />
                Bulk Generate
              </button>
            </div>
          </div>

          {/* AI Scheduler Insight */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 glass-card rounded-[2.5rem] p-6 border border-[#ff1744]/20 bg-gradient-to-r from-[#ff1744]/10 to-transparent flex items-center gap-6"
          >
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center shrink-0 shadow-lg">
              <Sparkles className="text-white fill-white" size={28} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-black uppercase tracking-widest text-[10px] text-[#ff1744]">AI Smart Scheduling</h2>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <button onClick={generateAiInsights} className="text-[10px] font-black underline uppercase text-[#888] hover:text-white transition-colors">Analyze Demand</button>
              </div>
              <p className="text-sm text-[#ccc] leading-relaxed">
                {isAiLoading ? "Processing historical booking clusters..." : aiInsight || "No insights yet. Analyze demand to see scheduling suggestions."}
              </p>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Capacity", value: totalSlots, icon: Zap, color: "text-blue-500" },
              { label: "Blocked Units", value: blockedSlots, icon: ShieldAlert, color: "text-red-500" },
              { label: "Weekly Utilization", value: `${utilization}%`, icon: Smartphone, color: utilization > "70" ? "text-orange-500" : "text-green-500" },
              { label: "Status", value: "Optimal", icon: CheckCircle, color: "text-green-500" },
            ].map((stat, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 border border-white/5 flex items-center gap-4">
                <div className={`p-2 rounded-xl bg-white/5 ${stat.color}`}>
                  <stat.icon size={18} />
                </div>
                <div>
                  <div className="text-xl font-black tracking-tight">{stat.value}</div>
                  <div className="text-[10px] font-bold text-[#888] uppercase tracking-widest">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Calendar View */}
          <div className="glass-card rounded-[2.5rem] p-8 border border-white/5">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className="flex items-center p-1 bg-white/5 rounded-2xl border border-white/5">
                  <button onClick={() => navigateWeek(-1)} className="p-3 hover:bg-white/10 rounded-xl transition-all"><ChevronLeft size={20} /></button>
                  <button onClick={() => navigateWeek(1)} className="p-3 hover:bg-white/10 rounded-xl transition-all"><ChevronRight size={20} /></button>
                </div>
                <h2 className="text-2xl font-black tracking-tighter">
                  {currentWeekStart.toLocaleDateString("en-IN", { month: "long", day: "numeric" })}
                  <span className="mx-2 text-[#444]">/</span>
                  <span className="text-[#888]">{weekDays[6].toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}</span>
                </h2>
              </div>
              <button onClick={loadSlots} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"><RefreshCw size={20} /></button>
            </div>

            {isLoading ? (
              <div className="text-center py-32 space-y-4">
                <div className="w-12 h-12 border-4 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-[#888] font-black uppercase tracking-widest text-[10px]">Syncing Timeline...</p>
              </div>
            ) : (
              <div className="overflow-x-auto pb-6">
                <table className="w-full border-separate border-spacing-2">
                  <thead>
                    <tr>
                      <th className="p-4 text-left text-[10px] font-black text-[#444] uppercase tracking-widest min-w-[100px]">Time / Day</th>
                      {weekDays.map((day, i) => {
                        const isToday = day.toDateString() === new Date().toDateString();
                        return (
                          <th key={i} className="p-1 min-w-[120px]">
                            <div className={`rounded-2xl p-4 transition-all border-2 ${isToday ? "bg-[#ff1744]/10 border-[#ff1744]" : "bg-white/5 border-transparent"}`}>
                              <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isToday ? "text-[#ff1744]" : "text-[#444]"}`}>{day.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                              <div className={`text-2xl font-black ${isToday ? "text-white" : "text-[#888]"}`}>{day.getDate()}</div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((time) => (
                      <tr key={time}>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tight">{time}</span>
                            <span className="text-[10px] font-bold text-[#444] uppercase">AM/PM</span>
                          </div>
                        </td>
                        {weekDays.map((day, i) => {
                          const slot = getSlotForDateTime(day, time);
                          const isPast = day < new Date() && day.toDateString() !== new Date().toDateString();

                          if (!slot) {
                            return (
                              <td key={i} className="p-1 opacity-20">
                                <div className="h-24 rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center">
                                  <Info size={16} className="text-[#222]" />
                                </div>
                              </td>
                            );
                          }

                          const isFull = slot.current_occupancy >= slot.max_capacity;
                          const isBlocked = slot.is_blocked;
                          const utilizationPct = (slot.current_occupancy / slot.max_capacity) * 100;

                          return (
                            <td key={i} className="p-1">
                              <motion.div
                                layout
                                whileHover={{ scale: isPast ? 1 : 1.02, y: isPast ? 0 : -2 }}
                                className={`h-24 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between transition-all border-2 ${isBlocked
                                  ? "bg-red-500/10 border-red-500/30"
                                  : isFull
                                    ? "bg-orange-500/10 border-orange-500/30"
                                    : "bg-[#d4af37]/5 border-white/5 hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                                  } ${isPast ? "opacity-20 pointer-events-none grayscale" : "cursor-pointer"}`}
                                onClick={() => !isPast && toggleBlock(slot)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${isBlocked ? "text-red-500" : isFull ? "text-orange-500" : "text-[#d4af37]"}`}>
                                    {isBlocked ? "Blocked" : `${slot.current_occupancy} / ${slot.max_capacity}`}
                                  </span>
                                  {!isBlocked && !isPast && (
                                    <div className="flex gap-1">
                                      <button onClick={(e) => { e.stopPropagation(); updateCapacity(slot, -1); }} className="w-5 h-5 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs font-black">-</button>
                                      <button onClick={(e) => { e.stopPropagation(); updateCapacity(slot, 1); }} className="w-5 h-5 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs font-black">+</button>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[9px] font-bold text-[#666] uppercase">
                                    <span>Occupancy</span>
                                    <span>{Math.round(utilizationPct)}%</span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${utilizationPct}%` }}
                                      className={`h-full rounded-full ${isFull ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" : "bg-[#d4af37]"}`}
                                    />
                                  </div>
                                </div>

                                {isBlocked && (
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12">
                                    <span className="text-[8px] font-black uppercase tracking-[0.5em] text-red-500/20 whitespace-nowrap">OFFLINE MODE</span>
                                  </div>
                                )}
                              </motion.div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Legend */}
            <div className="mt-8 flex flex-wrap items-center gap-8 justify-center pt-8 border-t border-white/5">
              {[
                { label: "Available Space", color: "bg-[#d4af37]/20 border-[#d4af37]/40" },
                { label: "High Occupancy", color: "bg-orange-500/20 border-orange-500/40" },
                { label: "Manual Block", color: "bg-red-500/20 border-red-500/40" },
                { label: "Expired", color: "bg-white/5 opacity-30" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-md border ${item.color}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#888]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showGenerateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowGenerateModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#ff1744] flex items-center justify-center shadow-lg shadow-[#ff1744]/20"><Plus size={24} /></div>
                <h2 className="text-2xl font-black">Generate Timeline</h2>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">Start Date</label>
                    <input type="date" value={generateForm.start_date} onChange={(e) => setGenerateForm({ ...generateForm, start_date: e.target.value })} className="w-full px-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[#ff1744] outline-none font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">End Date</label>
                    <input type="date" value={generateForm.end_date} onChange={(e) => setGenerateForm({ ...generateForm, end_date: e.target.value })} className="w-full px-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[#ff1744] outline-none font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">Daily Frequency</label>
                    <select value={generateForm.slots_per_day} onChange={(e) => setGenerateForm({ ...generateForm, slots_per_day: parseInt(e.target.value) })} className="w-full px-4 py-4 rounded-2xl bg-white/5 border border-white/10 outline-none font-bold">
                      {[4, 6, 8, 10].map(n => <option key={n} value={n}>{n} Slots</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#888] uppercase tracking-widest ml-1">Bay Capacity</label>
                    <select value={generateForm.max_capacity} onChange={(e) => setGenerateForm({ ...generateForm, max_capacity: parseInt(e.target.value) })} className="w-full px-4 py-4 rounded-2xl bg-white/5 border border-white/10 outline-none font-bold">
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Cars / Slot</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowGenerateModal(false)} className="flex-1 py-5 bg-white/5 rounded-2xl font-black uppercase tracking-widest text-xs">Abort</button>
                  <button onClick={generateSlots} className="flex-2 py-5 btn-premium rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#ff1744]/20">Initialize Schedule</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}



