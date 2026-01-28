"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Plus, X, Ban, RefreshCw, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import toast from "react-hot-toast";
import type { AvailabilitySlot } from "@/lib/types";

export default function SlotsPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
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

  useEffect(() => {
    loadSlots();
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

  const generateSlots = async () => {
    const res = await fetch("/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generate: true, ...generateForm }),
    });
    if (res.ok) {
      toast.success("Slots generated!");
      setShowGenerateModal(false);
      loadSlots();
    } else {
      toast.error("Failed to generate slots");
    }
  };

  const toggleBlock = async (slot: AvailabilitySlot) => {
    const res = await fetch(`/api/slots/${slot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_blocked: !slot.is_blocked, reason: slot.is_blocked ? null : "Blocked by admin" }),
    });
    if (res.ok) {
      toast.success(slot.is_blocked ? "Slot unblocked" : "Slot blocked");
      loadSlots();
    }
  };

  const updateCapacity = async (slot: AvailabilitySlot, delta: number) => {
    const newCapacity = Math.max(1, slot.max_capacity + delta);
    const res = await fetch(`/api/slots/${slot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ max_capacity: newCapacity }),
    });
    if (res.ok) {
      toast.success("Capacity updated");
      loadSlots();
    }
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

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"
  ];

  const getSlotForDateTime = (date: Date, time: string) => {
    const dateStr = date.toISOString().split("T")[0];
    return slots.find((s) => s.date === dateStr && s.start_time === time);
  };

  const totalSlots = slots.length;
  const blockedSlots = slots.filter((s) => s.is_blocked).length;
  const bookedSlots = slots.filter((s) => s.current_occupancy >= s.max_capacity).length;

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="py-8 pb-16 max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Slot Management</h1>
            <p className="text-[#888]">Configure availability and booking slots</p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn-premium px-6 py-3 rounded-xl text-white flex items-center gap-2"
          >
            <Plus size={18} />
            Generate Slots
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Slots", value: totalSlots, icon: Calendar, color: "from-blue-500 to-cyan-500" },
            { label: "Blocked", value: blockedSlots, icon: Ban, color: "from-red-500 to-orange-500" },
            { label: "Fully Booked", value: bookedSlots, icon: Users, color: "from-green-500 to-emerald-500" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon size={24} className="text-white" />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-[#888]">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateWeek(-1)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="font-semibold">
                {currentWeekStart.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} -{" "}
                {weekDays[6].toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
              </h2>
              <button
                onClick={() => navigateWeek(1)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <button
              onClick={loadSlots}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-sm text-[#888] font-medium w-20">Time</th>
                    {weekDays.map((day, i) => {
                      const isToday = day.toDateString() === new Date().toDateString();
                      return (
                        <th key={i} className={`p-3 text-center text-sm font-medium ${isToday ? "text-[#ff1744]" : "text-[#888]"}`}>
                          <div>{day.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                          <div className={`text-lg ${isToday ? "text-[#ff1744]" : "text-white"}`}>{day.getDate()}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((time) => (
                    <tr key={time}>
                      <td className="p-3 text-sm text-[#888] font-medium">{time}</td>
                      {weekDays.map((day, i) => {
                        const slot = getSlotForDateTime(day, time);
                        const isPast = day < new Date() && day.toDateString() !== new Date().toDateString();

                        if (!slot) {
                          return (
                            <td key={i} className="p-2">
                              <div className={`h-16 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center ${isPast ? "opacity-30" : ""}`}>
                                <span className="text-xs text-[#666]">-</span>
                              </div>
                            </td>
                          );
                        }

                        const isFull = slot.current_occupancy >= slot.max_capacity;
                        const isBlocked = slot.is_blocked;
                        const utilization = (slot.current_occupancy / slot.max_capacity) * 100;

                        return (
                          <td key={i} className="p-2">
                            <motion.div
                              whileHover={{ scale: isPast ? 1 : 1.02 }}
                              className={`h-16 rounded-lg p-2 relative overflow-hidden cursor-pointer transition-colors ${isBlocked
                                ? "bg-red-500/20 border border-red-500/50"
                                : isFull
                                  ? "bg-yellow-500/20 border border-yellow-500/50"
                                  : "bg-green-500/20 border border-green-500/50"
                                } ${isPast ? "opacity-30 pointer-events-none" : ""}`}
                              onClick={() => !isPast && toggleBlock(slot)}
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className={isBlocked ? "text-red-500" : isFull ? "text-yellow-500" : "text-green-500"}>
                                  {isBlocked ? "Blocked" : `${slot.current_occupancy}/${slot.max_capacity}`}
                                </span>
                                {!isBlocked && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); updateCapacity(slot, -1); }}
                                      className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-xs"
                                    >
                                      -
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); updateCapacity(slot, 1); }}
                                      className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>
                              {!isBlocked && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                                  <div
                                    className={`h-full ${isFull ? "bg-yellow-500" : "bg-green-500"}`}
                                    style={{ width: `${utilization}%` }}
                                  />
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

          <div className="mt-6 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500" />
              <span className="text-[#888]">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500/30 border border-yellow-500" />
              <span className="text-[#888]">Full</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500" />
              <span className="text-[#888]">Blocked</span>
            </div>
          </div>
        </div>
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowGenerateModal(false)}>
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="w-full max-w-md bg-[#111] rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Generate Slots</h2>
              <button onClick={() => setShowGenerateModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#888] mb-2">Start Date</label>
                <input
                  type="date"
                  value={generateForm.start_date}
                  onChange={(e) => setGenerateForm({ ...generateForm, start_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-[#888] mb-2">End Date</label>
                <input
                  type="date"
                  value={generateForm.end_date}
                  onChange={(e) => setGenerateForm({ ...generateForm, end_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#888] mb-2">Slots/Day</label>
                  <select
                    value={generateForm.slots_per_day}
                    onChange={(e) => setGenerateForm({ ...generateForm, slots_per_day: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    {[4, 6, 8].map((n) => (
                      <option key={n} value={n}>{n} slots</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#888] mb-2">Capacity</label>
                  <select
                    value={generateForm.max_capacity}
                    onChange={(e) => setGenerateForm({ ...generateForm, max_capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n} per slot</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowGenerateModal(false)} className="flex-1 px-6 py-3 rounded-xl bg-white/5">Cancel</button>
              <button onClick={generateSlots} className="flex-1 btn-premium px-6 py-3 rounded-xl text-white">Generate</button>
            </div>
          </motion.div>
        </div>
      )}
      <Footer />
    </main>
  );
}



