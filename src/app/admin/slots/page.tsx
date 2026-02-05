"use client";

import React, { useState, useEffect } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
  Sparkles, Brain, Zap, Info, ShieldAlert, CheckCircle, Smartphone,
  Calendar, ChevronLeft, ChevronRight, RefreshCw, Plus, Clock, X
} from "lucide-react";

import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { AvailabilitySlot } from "@/lib/types";

export default function SlotsPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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
    try {
      const res = await fetch(`/api/slots/${slot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_blocked: !slot.is_blocked, reason: slot.is_blocked ? null : "Admin override" }),
      });
      if (res.ok) {
        toast.success(slot.is_blocked ? "Slot reactivated" : "Slot blocked");
      }
    } catch (e) {
      toast.error("Network synchronization failed");
    }
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
  const occupancySum = slots.reduce((sum, s) => sum + s.current_occupancy, 0);
  const totalCapacity = slots.reduce((sum, s) => sum + s.max_capacity, 0);
  const utilization = totalCapacity > 0 ? ((occupancySum / totalCapacity) * 100).toFixed(0) : "0";

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">

      <div className="flex-1 overflow-auto pb-24 lg:pb-8">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tighter flex items-center gap-3">
                <Calendar className="text-[#ff1744]" />
                Slot Master
              </h1>
              <p className="text-[#888] mt-1 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Capacity Management Live
              </p>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="btn-premium px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Bulk Generate
            </button>
          </div>

          {/* AI Scheduler Insight */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 glass-card rounded-2xl lg:rounded-[2.5rem] border border-[#ff1744]/20 bg-gradient-to-r from-[#ff1744]/10 to-transparent flex flex-col sm:flex-row items-center gap-6"
          >
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center shrink-0 shadow-lg">
              <Sparkles className="text-white fill-white" size={28} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="font-black uppercase tracking-widest text-[10px] text-[#ff1744]">AI Smart Scheduling</h2>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <button onClick={generateAiInsights} className="text-[10px] font-black underline uppercase text-[#888] hover:text-white transition-colors">Analyze Demand</button>
              </div>
              <p className="text-xs lg:text-sm text-[#ccc] leading-relaxed">
                {isAiLoading ? "Processing historical booking clusters..." : aiInsight || "No insights yet. Analyze demand to see scheduling suggestions."}
              </p>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Units", value: totalSlots, icon: Zap, color: "text-blue-500" },
              { label: "Blocked", value: blockedSlots, icon: ShieldAlert, color: "text-red-500" },
              { label: "Utilization", value: `${utilization}%`, icon: Smartphone, color: parseInt(utilization) > 70 ? "text-orange-500" : "text-green-500" },
              { label: "Status", value: "Ready", icon: CheckCircle, color: "text-green-500" },
            ].map((stat, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 border border-white/5 flex items-center gap-3 lg:gap-4">
                <div className={`p-2 lg:p-3 rounded-xl bg-white/5 ${stat.color}`}>
                  <stat.icon size={18} className="lg:w-5 lg:h-5" />
                </div>
                <div>
                  <div className="text-xl lg:text-2xl font-black tracking-tighter truncate">{stat.value}</div>
                  <div className="text-[8px] lg:text-[10px] font-black text-[#555] uppercase tracking-widest">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Calendar View */}
          <div className="glass-card rounded-2xl lg:rounded-[2.5rem] p-4 lg:p-8 border border-white/5 overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex items-center p-1 bg-white/5 rounded-2xl border border-white/5 w-fit">
                  <button onClick={() => navigateWeek(-1)} className="p-3 hover:bg-white/10 rounded-xl transition-all"><ChevronLeft size={20} /></button>
                  <button onClick={() => navigateWeek(1)} className="p-3 hover:bg-white/10 rounded-xl transition-all"><ChevronRight size={20} /></button>
                </div>
                <h2 className="text-xl lg:text-2xl font-black tracking-tighter">
                  {currentWeekStart.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  <span className="mx-2 text-[#444]">-</span>
                  <span className="text-[#888]">{weekDays[6].toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={loadSlots} className="flex-1 lg:flex-initial p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2">
                  <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                  <span className="lg:hidden text-[10px] font-black uppercase tracking-widest">Refresh</span>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-32 space-y-4">
                <div className="w-12 h-12 border-4 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-[#888] font-black uppercase tracking-widest text-[10px]">Syncing Timeline...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Horizontal Date Picker for Mobile */}
                <div className="flex lg:hidden overflow-x-auto no-scrollbar gap-3 -mx-4 px-4 pb-2">
                  {weekDays.map((day, i) => {
                    const isSelected = day.toDateString() === selectedDate.toDateString();
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(day)}
                        className={`flex-shrink-0 w-16 py-4 rounded-2xl border-2 transition-all flex flex-col items-center group ${isSelected ? "bg-[#ff1744] border-[#ff1744] shadow-lg shadow-[#ff1744]/20" : "bg-white/5 border-white/5"}`}
                      >
                        <span className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isSelected ? "text-white/80" : "text-[#444]"}`}>{day.toLocaleDateString("en-IN", { weekday: "short" })}</span>
                        <span className={`text-xl font-black ${isSelected ? "text-white" : "text-[#888]"}`}>{day.getDate()}</span>
                        {isToday && !isSelected && <div className="w-1 h-1 rounded-full bg-[#ff1744] mt-1" />}
                      </button>
                    );
                  })}
                </div>

                {/* Mobile Slot List */}
                <div className="lg:hidden grid grid-cols-1 gap-3">
                  {timeSlots.map((time) => {
                    const slot = getSlotForDateTime(selectedDate, time);
                    const isPast = selectedDate < new Date() && selectedDate.toDateString() !== new Date().toDateString();

                    if (!slot) return null;

                    const isFull = slot.current_occupancy >= slot.max_capacity;
                    const isBlocked = slot.is_blocked;
                    const utilizationPct = (slot.current_occupancy / slot.max_capacity) * 100;

                    return (
                      <motion.div
                        key={time}
                        layout
                        onClick={() => !isPast && toggleBlock(slot)}
                        className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-4 transition-all ${isBlocked ? "bg-red-500/10 border-red-500/20" : isFull ? "bg-orange-500/10 border-orange-500/20" : "bg-white/[0.03] border-white/5"}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border ${isBlocked ? "border-red-500/20 bg-red-500/5" : "border-white/5 bg-white/5"}`}>
                            <Clock size={16} className={isBlocked ? "text-red-500" : "text-[#d4af37]"} />
                            <span className="text-[10px] font-black tracking-tight mt-0.5">{time}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isBlocked ? "text-red-500" : "text-white"}`}>
                                {isBlocked ? "Blocked" : `Capacity: ${slot.current_occupancy}/${slot.max_capacity}`}
                              </span>
                            </div>
                            {!isBlocked && (
                              <div className="w-32 h-1 rounded-full bg-white/5 overflow-hidden">
                                <div className={`h-full ${isFull ? "bg-orange-500" : "bg-[#d4af37]"}`} style={{ width: `${utilizationPct}%` }} />
                              </div>
                            )}
                          </div>
                        </div>
                        {!isBlocked && !isPast && (
                          <div className="flex flex-col gap-1 items-center bg-black/20 p-1.5 rounded-xl border border-white/5">
                            <button onClick={(e) => { e.stopPropagation(); updateCapacity(slot, 1); }} className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center font-black">+</button>
                            <button onClick={(e) => { e.stopPropagation(); updateCapacity(slot, -1); }} className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center font-black">-</button>
                          </div>
                        )}
                        {isBlocked && <span className="text-[10px] font-black uppercase text-red-500 px-3 py-1 bg-red-500/10 rounded-lg">Override</span>}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Desktop Grid View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full border-separate border-spacing-2">
                    <thead>
                      <tr>
                        <th className="p-4 text-left text-[10px] font-black text-[#444] uppercase tracking-widest min-w-[100px]">Pulse / Timeline</th>
                        {weekDays.map((day, i) => {
                          const isToday = day.toDateString() === new Date().toDateString();
                          return (
                            <th key={i} className="p-1 min-w-[120px]">
                              <div className={`rounded-[2rem] p-4 transition-all border-2 ${isToday ? "bg-[#ff1744]/10 border-[#ff1744]" : "bg-white/[0.02] border-transparent"}`}>
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
                              <span className="text-xl font-black tracking-tighter">{time}</span>
                              <span className="text-[9px] font-black text-[#333] uppercase">Shift Alpha</span>
                            </div>
                          </td>
                          {weekDays.map((day, i) => {
                            const slot = getSlotForDateTime(day, time);
                            const isPast = day < new Date() && day.toDateString() !== new Date().toDateString();

                            if (!slot) {
                              return (
                                <td key={i} className="p-1 opacity-10">
                                  <div className="h-24 rounded-[1.5rem] border-2 border-dashed border-white/5 flex items-center justify-center">
                                    <Info size={16} />
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
                                  whileHover={{ scale: isPast ? 1 : 1.02 }}
                                  className={`h-24 rounded-[1.5rem] p-4 relative overflow-hidden flex flex-col justify-between transition-all border-2 ${isBlocked
                                    ? "bg-red-500/10 border-red-500/30"
                                    : isFull
                                      ? "bg-orange-500/10 border-orange-500/30"
                                      : "bg-white/[0.02] border-white/5 hover:border-[#ff1744]/30 hover:bg-[#ff1744]/5"
                                    } ${isPast ? "opacity-20 pointer-events-none grayscale" : "cursor-pointer group"}`}
                                  onClick={() => !isPast && toggleBlock(slot)}
                                >
                                  <div className="flex items-center justify-between z-10">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isBlocked ? "text-red-500" : isFull ? "text-orange-500" : "text-white/60"}`}>
                                      {isBlocked ? "BLOCKED" : `${slot.current_occupancy}/${slot.max_capacity}`}
                                    </span>
                                    {!isBlocked && !isPast && (
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); updateCapacity(slot, -1); }} className="w-5 h-5 rounded-lg bg-white/5 hover:bg-[#ff1744] flex items-center justify-center text-[10px] transition-colors">-</button>
                                        <button onClick={(e) => { e.stopPropagation(); updateCapacity(slot, 1); }} className="w-5 h-5 rounded-lg bg-white/5 hover:bg-[#ff1744] flex items-center justify-center text-[10px] transition-colors">+</button>
                                      </div>
                                    )}
                                  </div>

                                  {!isBlocked && (
                                    <div className="space-y-2 z-10">
                                      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${utilizationPct}%` }}
                                          className={`h-full rounded-full ${isFull ? "bg-orange-500" : "bg-gradient-to-r from-[#ff1744] to-[#d4af37]"}`}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {isBlocked && <ShieldAlert size={14} className="text-red-500/20 absolute bottom-3 right-3" />}
                                </motion.div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div className="mt-8 flex flex-wrap items-center gap-6 lg:gap-8 justify-center pt-8 border-t border-white/5">
                  {[
                    { label: "Optimal", color: "bg-white/5 border-white/10" },
                    { label: "Full Bay", color: "bg-orange-500/20 border-orange-500/40" },
                    { label: "Override", color: "bg-red-500/20 border-red-500/40" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full border ${item.color}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#555]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showGenerateModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowGenerateModal(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-[#0d0d0d] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[3rem] p-8 lg:p-10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#ff1744] flex items-center justify-center shadow-lg"><Plus size={24} /></div>
                <div>
                  <h2 className="text-2xl font-black tracking-tighter">Timeline Initialization</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#444] mt-1">Bulk Schedule Matrix</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#555] uppercase tracking-widest ml-1">Vector Start</label>
                    <input type="date" value={generateForm.start_date} onChange={(e) => setGenerateForm({ ...generateForm, start_date: e.target.value })} className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] outline-none font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#555] uppercase tracking-widest ml-1">Vector End</label>
                    <input type="date" value={generateForm.end_date} onChange={(e) => setGenerateForm({ ...generateForm, end_date: e.target.value })} className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] outline-none font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#555] uppercase tracking-widest ml-1">Density</label>
                    <select value={generateForm.slots_per_day} onChange={(e) => setGenerateForm({ ...generateForm, slots_per_day: parseInt(e.target.value) })} className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 outline-none font-bold appearance-none">
                      {[4, 6, 8, 10].map(n => <option key={n} value={n}>{n} Units / Day</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#555] uppercase tracking-widest ml-1">Bay Capacity</label>
                    <select value={generateForm.max_capacity} onChange={(e) => setGenerateForm({ ...generateForm, max_capacity: parseInt(e.target.value) })} className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 outline-none font-bold appearance-none">
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Cars / Bay</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-6">
                  <button onClick={() => setShowGenerateModal(false)} className="flex-1 py-4 bg-white/5 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</button>
                  <button onClick={generateSlots} className="flex-2 py-4 btn-premium rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg">Activate</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
